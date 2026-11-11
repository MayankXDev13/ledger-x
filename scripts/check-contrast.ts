#!/usr/bin/env bun
/**
 * Measures the WCAG contrast of every token pair the specs name.
 *
 * The design system states contrast floors rather than eyeballing them, so
 * this script parses the real token values out of both clients' stylesheets
 * and reports the measured ratio for each pair.
 *
 * Run: `bun run scripts/check-contrast.ts`
 */
import { readFileSync } from "node:fs";

type Rgb = { r: number; g: number; b: number };

/** Parses #rgb, #rrggbb and the oklch() values the clients use. */
function parseColor(value: string): Rgb | null {
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) {
      digits = digits
        .split("")
        .map((d) => d + d)
        .join("");
    }
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
    };
  }

  const oklch = value
    .trim()
    .match(/^oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)/i);
  if (oklch) {
    return oklchToRgb(
      Number(oklch[1]),
      Number(oklch[2]),
      Number(oklch[3]),
    );
  }

  return null;
}

/** Minimal OKLCH → sRGB conversion (enough for WCAG ratios). */
function oklchToRgb(l: number, c: number, h: number): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r =
    +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g =
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bl =
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const clamp = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * 255)));

  return { r: clamp(r), g: clamp(g), b: clamp(bl) };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/** Reads `--name: value` declarations out of a CSS block. */
function readTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

const webCss = readFileSync(
  new URL("../apps/web/app/globals.css", import.meta.url).pathname,
  "utf8",
);
const webRoot = readTokens(block(webCss, ":root"));
const webDark = readTokens(block(webCss, ".dark"));

/** Reads the mobile runtime palette out of `lib/theme.ts`. */
function readMobileTokens(): Map<string, string> {
  const source = readFileSync(
    new URL("../apps/app/lib/theme.ts", import.meta.url).pathname,
    "utf8",
  );
  const tokens = new Map<string, string>();
  const colorsBlock = source.slice(
    source.indexOf("export const colors"),
    source.indexOf("} as const;"),
  );
  for (const match of colorsBlock.matchAll(
    /([A-Za-z0-9_]+):\s*"(#[0-9a-fA-F]{3,8})"/g,
  )) {
    tokens.set(match[1], match[2]);
  }
  return tokens;
}

const mobileTokens = readMobileTokens();

type Pair = {
  client: "web" | "mobile";
  theme: "light" | "dark";
  label: string;
  foreground: string;
  background: string;
  floor: number;
};

const PAIRS: Pair[] = [
  // ---- web ----
  {
    client: "web",
    theme: "light",
    label: "body text on the page",
    foreground: "--foreground",
    background: "--background",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "body text on the page",
    foreground: "--foreground",
    background: "--background",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "card text on a card",
    foreground: "--card-foreground",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "card text on a card",
    foreground: "--card-foreground",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "muted text on a card",
    foreground: "--muted-foreground",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "muted text on a card",
    foreground: "--muted-foreground",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "primary button label",
    foreground: "--primary-foreground",
    background: "--primary",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "primary button label",
    foreground: "--primary-foreground",
    background: "--primary",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "brand text on the page",
    foreground: "--brand-text",
    background: "--background",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "brand text on the page",
    foreground: "--brand-text",
    background: "--background",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "money received on a card",
    foreground: "--positive",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "money received on a card",
    foreground: "--positive",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "destructive label on a card",
    foreground: "--destructive",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "dark",
    label: "destructive label on a card",
    foreground: "--destructive",
    background: "--card",
    floor: 4.5,
  },
  {
    client: "web",
    theme: "light",
    label: "chart series 1 (paid)",
    foreground: "--chart-1",
    background: "--card",
    floor: 3,
  },
  {
    client: "web",
    theme: "dark",
    label: "chart series 1 (paid)",
    foreground: "--chart-1",
    background: "--card",
    floor: 3,
  },
  {
    client: "web",
    theme: "light",
    label: "chart series 2 (credit)",
    foreground: "--chart-2",
    background: "--card",
    floor: 3,
  },
  {
    client: "web",
    theme: "dark",
    label: "chart series 2 (credit)",
    foreground: "--chart-2",
    background: "--card",
    floor: 3,
  },
  // ---- mobile ----
  {
    client: "mobile",
    theme: "dark",
    label: "primary text on the app background",
    foreground: "ink",
    background: "bg",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "muted text on the app background",
    foreground: "inkMuted",
    background: "bg",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "muted text on a surface",
    foreground: "inkMuted",
    background: "surface",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "white label on the brand fill",
    foreground: "white",
    background: "brandFill",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "brand text on the app background",
    foreground: "brandText",
    background: "bg",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "money received on a surface",
    foreground: "positive",
    background: "surface",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "overdue text on a surface",
    foreground: "dangerText",
    background: "surface",
    floor: 4.5,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "60+ aging segment on a surface",
    foreground: "aging60plus",
    background: "surface",
    floor: 3,
  },
  {
    client: "mobile",
    theme: "dark",
    label: "0-30 aging segment on a surface",
    foreground: "aging0to30",
    background: "surface",
    floor: 3,
  },
];

function resolve(pair: Pair, token: string): Rgb | null {
  if (pair.client === "web") {
    const source = pair.theme === "light" ? webRoot : webDark;
    const value = source.get(token) ?? webRoot.get(token);
    return value ? parseColor(value) : null;
  }
  const value = mobileTokens.get(token);
  return value ? parseColor(value) : null;
}

let failures = 0;
console.log("Contrast report\n");

for (const pair of PAIRS) {
  const foreground = resolve(pair, pair.foreground);
  const background = resolve(pair, pair.background);
  if (!foreground || !background) {
    console.log(
      `  ? ${pair.client}/${pair.theme}: ${pair.label} — could not resolve ${!foreground ? pair.foreground : pair.background}`,
    );
    failures += 1;
    continue;
  }
  const ratio = contrast(foreground, background);
  const ok = ratio >= pair.floor;
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? "✓" : "✗"} ${pair.client}/${pair.theme}: ${pair.label} — ${ratio.toFixed(2)}:1 (floor ${pair.floor}:1)`,
  );
}

if (failures > 0) {
  console.error(`\n✗ ${failures} contrast check(s) failed`);
  process.exit(1);
}
console.log("\n✓ every token pair meets its stated floor");
