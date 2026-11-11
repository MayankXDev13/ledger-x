#!/usr/bin/env bun
/**
 * Captures the web screenshot matrix for task 8.3 of the
 * `audit-ui-ux-and-generate-artifacts` change, against the local production
 * build backed by the mock API.
 *
 * The matrix covers every screen the web-visual-system spec names — login,
 * dashboard, customers, customer detail, statement, collection, settings —
 * plus a 360px pass, in BOTH the dark and the light theme.
 *
 * Run:
 *   bun run scripts/mock-api.ts                       # terminal 1
 *   cd apps/web && NEXT_PUBLIC_API_URL=http://127.0.0.1:8787 bun run build
 *   cd apps/web && NEXT_PUBLIC_API_URL=http://127.0.0.1:8787 bun run start  # terminal 2
 *   bun run scripts/capture-web.ts
 */
import { Cdp, launchChrome, newTarget } from "./cdp";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const OUT =
  "/home/mayank/Coding/ledger-x/openspec/changes/audit-ui-ux-and-generate-artifacts/screenshots/web";

/** The customer the mock API seeds first; used by the detail and statement routes. */
const CUSTOMER_ID = "c1";

type Theme = "dark" | "light";

interface Shot {
  /** File name without extension. */
  name: string;
  path: string;
  width: number;
  height: number;
  mobile?: boolean;
  /** Text that must appear before the shot is taken. */
  waitFor?: string;
}

const SCREENS: Shot[] = [
  { name: "01-login", path: "/login", width: 1440, height: 900, waitFor: "Continue with Google" },
  { name: "02-dashboard", path: "/dashboard", width: 1440, height: 900, waitFor: "Total Balance" },
  { name: "03-customers", path: "/customers", width: 1440, height: 900, waitFor: "Customers" },
  {
    name: "04-customer-detail",
    path: `/customers/detail?id=${CUSTOMER_ID}`,
    width: 1440,
    height: 900,
    waitFor: "Sunita Devi",
  },
  {
    name: "05-statement",
    path: `/customers/statement?id=${CUSTOMER_ID}`,
    width: 1440,
    height: 900,
    waitFor: "Statement",
  },
  { name: "06-collection", path: "/collection", width: 1440, height: 900, waitFor: "Collection" },
  { name: "07-settings", path: "/settings", width: 1440, height: 900, waitFor: "Account" },
  { name: "08-login-360", path: "/login", width: 360, height: 800, mobile: true, waitFor: "Continue with Google" },
  { name: "09-dashboard-360", path: "/dashboard", width: 360, height: 800, mobile: true, waitFor: "Total Balance" },
  { name: "10-customers-360", path: "/customers", width: 360, height: 800, mobile: true, waitFor: "Customers" },
  {
    name: "11-customer-detail-360",
    path: `/customers/detail?id=${CUSTOMER_ID}`,
    width: 360,
    height: 800,
    mobile: true,
    waitFor: "Sunita Devi",
  },
  {
    name: "12-statement-360",
    path: `/customers/statement?id=${CUSTOMER_ID}`,
    width: 360,
    height: 800,
    mobile: true,
    waitFor: "Statement",
  },
  { name: "13-collection-360", path: "/collection", width: 360, height: 800, mobile: true, waitFor: "Collection" },
  { name: "14-settings-360", path: "/settings", width: 360, height: 800, mobile: true, waitFor: "Account" },
];

const chrome = await launchChrome();
const target = await newTarget(9222);
const cdp = await Cdp.connect(9222, target.id);

await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Network.enable");
await cdp.seedLocalStorage(BASE, { ledgerx_token: "mock-token" });

mkdirSync(OUT, { recursive: true });

const failures: string[] = [];

async function captureTheme(theme: Theme) {
  for (const shot of SCREENS) {
    const file = `${OUT}/${shot.name}-${theme}.png`;
    try {
      await cdp.setViewport(shot.width, shot.height, shot.mobile ?? false);
      // next-themes reads the persisted theme from localStorage, so the
      // class is set before the app hydrates.
      await cdp.seedLocalStorage(BASE, { theme });
      await cdp.goto(`${BASE}${shot.path}`);
      if (shot.waitFor) {
        const needle = shot.waitFor.toLowerCase();
        await cdp.waitFor(
          `(() => { const t = document.body.innerText.toLowerCase(); return t.includes(${JSON.stringify(needle)}); })()`,
          30_000,
        );
      }
      // Let charts and transitions settle.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await cdp.screenshot(file, true);
      console.log(`✓ ${shot.name}-${theme}`);
    } catch (error) {
      failures.push(`${shot.name}-${theme}: ${(error as Error).message}`);
      console.log(`✗ ${shot.name}-${theme}: ${(error as Error).message}`);
    }
  }
}

for (const theme of ["dark", "light"] as Theme[]) {
  await captureTheme(theme);
}

cdp.close();
chrome.kill();

if (failures.length > 0) {
  console.error(`\n${failures.length} capture(s) failed`);
  process.exit(1);
}
console.log(`\ncaptured ${SCREENS.length * 2} screenshots into ${OUT}`);
