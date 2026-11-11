#!/usr/bin/env bun
/**
 * A tiny Chrome DevTools Protocol driver.
 *
 * The opencode browser tool needs the desktop app connected to the session,
 * which it is not here, so this drives the locally installed Chrome directly.
 * It is used to capture the web screenshot matrix and to time the
 * "record a transaction → it appears" flow against the deployed Worker API.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface CdpTarget {
  tabId: string;
}

export async function launchChrome(
  port = 9222,
  profile = "/tmp/opencode/chrome-profile",
): Promise<{ kill: () => void }> {
  mkdirSync(profile, { recursive: true });
  const child = spawn(
    "google-chrome",
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore", detached: true },
  );
  child.unref();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return { kill: () => process.kill(-child.pid, "SIGTERM") };
}

export class Cdp {
  private socket: WebSocket;
  private nextId = 1;
  private pending = new Map<number, (value: any) => void>();
  private events: Array<(event: { method: string; params: any }) => void> = [];

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.addEventListener("message", (event: MessageEvent) => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const resolve = this.pending.get(message.id)!;
        this.pending.delete(message.id);
        resolve(message.result ?? message.error);
      } else if (message.method) {
        for (const listener of this.events) listener(message);
      }
    });
  }

  static async connect(port: number, targetId: string): Promise<Cdp> {
    const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) =>
      r.json(),
    );
    const target = list.find((entry: any) => entry.id === targetId);
    if (!target) throw new Error(`no CDP target ${targetId}`);
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new Cdp(socket);
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<any> {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => this.pending.set(id, resolve));
  }

  on(listener: (event: { method: string; params: any }) => void) {
    this.events.push(listener);
  }

  /** Navigates and waits for the load event. */
  async goto(url: string, timeoutMs = 45_000) {
    const loaded = new Promise<void>((resolve) => {
      const listener = (event: { method: string }) => {
        if (event.method === "Page.loadEventFired") resolve();
      };
      this.on(listener);
    });
    await this.send("Page.navigate", { url });
    await Promise.race([
      loaded,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "evaluate failed");
    }
    return result?.result?.value as T;
  }

  /** Polls an expression until it returns truthy. */
  async waitFor<T>(expression: string, timeoutMs = 20_000, everyMs = 200): Promise<T> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await this.evaluate<T>(expression);
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, everyMs));
    }
    throw new Error(`timed out waiting for: ${expression.slice(0, 80)}`);
  }

  async setViewport(width: number, height: number, mobile = false) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  /** Seeds localStorage before any page script runs. */
  async seedLocalStorage(origin: string, entries: Record<string, string>) {
    const script = `
      try {
        const entries = ${JSON.stringify(entries)};
        for (const [key, value] of Object.entries(entries)) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {}
    `;
    await this.send("Page.addScriptToEvaluateOnNewDocument", { source: script });
    // The origin must match the page we are about to open.
    void origin;
  }

  async screenshot(path: string, fullPage = true) {
    const params: Record<string, unknown> = { format: "png" };
    if (fullPage) {
      const metrics = await this.send("Page.getLayoutMetrics");
      const content = metrics?.cssContentSize;
      if (content) {
        params.captureBeyondViewport = true;
        params.clip = {
          x: 0,
          y: 0,
          width: content.width,
          height: Math.min(content.height, 12_000),
          scale: 1,
        };
      }
    }
    const result = await this.send("Page.captureScreenshot", params);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, Buffer.from(result.data, "base64"));
    return path;
  }

  close() {
    this.socket.close();
  }
}

export async function newTarget(port: number, url = "about:blank") {
  const response = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error(`could not create target: ${response.status}`);
  return (await response.json()) as { id: string; webSocketDebuggerUrl: string };
}
