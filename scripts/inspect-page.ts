#!/usr/bin/env bun
/**
 * Prints what a page actually renders, plus console errors and failed
 * network requests. Used to debug a capture.
 *
 * Run: `bun run scripts/inspect-page.ts <url> [selector-text]
 */
import { Cdp, launchChrome, newTarget } from "./cdp";
import { readFileSync } from "node:fs";

const url = process.argv[2];
const needle = process.argv[3];
const TOKEN = readFileSync("/tmp/opencode/session-token.txt", "utf8").trim();

const chrome = await launchChrome(9223, "/tmp/opencode/chrome-profile-inspect");
const target = await newTarget(9223);
const cdp = await Cdp.connect(9223, target.id);

await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Log.enable");
await cdp.send("Network.enable");

const consoleErrors: string[] = [];
const failedRequests: string[] = [];

cdp.on((event) => {
  if (event.method === "Runtime.consoleAPICalled" && event.params?.type === "error") {
    consoleErrors.push(
      (event.params.args ?? [])
        .map((a: any) => a.value ?? a.description ?? "")
        .join(" ")
        .slice(0, 300),
    );
  }
  if (event.method === "Runtime.exceptionThrown") {
    consoleErrors.push(
      String(event.params?.exceptionDetails?.exception?.description ?? "exception").slice(0, 400),
    );
  }
  if (event.method === "Network.loadingFailed") {
    failedRequests.push(`${event.params?.type} ${event.params?.errorText} ${event.params?.requestId}`);
  }
  if (event.method === "Network.responseReceived") {
    const res = event.params?.response;
    if (res && res.status >= 400) {
      failedRequests.push(`${res.status} ${res.url}`);
    }
  }
});

await cdp.seedLocalStorage("https://ledgerx-613.pages.dev", {
  ledgerx_token: TOKEN,
});
await cdp.goto(url);
await new Promise((resolve) => setTimeout(resolve, 6000));

const text = await cdp.evaluate<string>("document.body.innerText");
console.log("---- page text ----");
console.log(text.slice(0, 3000));
console.log("---- console errors ----");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(none)");
console.log("---- failed requests ----");
console.log(failedRequests.length ? failedRequests.slice(0, 12).join("\n") : "(none)");
if (needle) {
  console.log(`---- contains "${needle}": ${text.includes(needle)} ----`);
}

cdp.close();
chrome.kill();
