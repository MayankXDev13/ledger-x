#!/usr/bin/env bun
/**
 * Dumps the axis tick labels of a chart, to check formatting.
 */
import { Cdp, launchChrome, newTarget } from "./cdp";
import { readFileSync } from "node:fs";

const url = process.argv[2];
const TOKEN = readFileSync("/tmp/opencode/session-token.txt", "utf8").trim();

const chrome = await launchChrome(9224, "/tmp/opencode/chrome-profile-ticks");
const target = await newTarget(9224);
const cdp = await Cdp.connect(9224, target.id);

await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.seedLocalStorage("https://ledgerx-613.pages.dev", { ledgerx_token: TOKEN });
await cdp.goto(url);
await new Promise((resolve) => setTimeout(resolve, 7000));

const ticks = await cdp.evaluate<string[]>(`(() => {
  return Array.from(document.querySelectorAll('.recharts-cartesian-axis-tick'))
    .map((el) => el.textContent);
})()`);
console.log("Y axis ticks:", JSON.stringify(ticks));

const legend = await cdp.evaluate<string[]>(`(() => {
  return Array.from(document.querySelectorAll('[class*="legend"]'))
    .map((el) => el.textContent)
    .filter((t) => t && t.length < 60);
})()`);
console.log("legend items:", JSON.stringify(legend));

const summary = await cdp.evaluate<string>(`(() => {
  const text = document.body.innerText;
  const m = text.match(/Across the last[^\\n]*/);
  const m2 = text.match(/Over the last 12 months[^\\n]*/);
  return JSON.stringify([m && m[0], m2 && m2[0]]);
})()`);
console.log("summaries:", summary);

const raw = await cdp.evaluate<string>(`(() => {
  const html = document.body.innerHTML;
  const matches = html.match(/-?₹?[0-9]+k/g) || [];
  return JSON.stringify(Array.from(new Set(matches)).slice(0, 20));
})()`);
console.log("axis-like tokens in DOM:", raw);

cdp.close();
chrome.kill();
