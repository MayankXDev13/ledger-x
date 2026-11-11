#!/usr/bin/env bun
/**
 * Fails when the web client drifts away from the visual system.
 *
 * The web design system allows exactly one brand hue (orange), reserves
 * emerald for money received, and defines every neutral and money colour as a
 * token. This check keeps a stray Tailwind palette colour — a blue or purple
 * accent, an emerald outside the money role, a raw red — from creeping back in.
 *
 * Run: `bun run scripts/check-web-colors.ts`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_ROOT = new URL("../apps/web", import.meta.url).pathname;

/** Directories that hold the client's own source. */
const SCAN_DIRS = ["app", "components", "lib"];

/** shadcn primitives ship their own palette usage and are not scanned. */
const IGNORED_PREFIXES = ["components/ui/"];

type Rule = {
  id: string;
  why: string;
  pattern: RegExp;
};

const RULES: Rule[] = [
  {
    id: "tailwind-blue-purple",
    why: "orange is the only brand hue; blue, purple and teal are excluded",
    pattern:
      /\b(?:bg|text|border|from|via|to|ring|fill|stroke|shadow)-(?:blue|indigo|violet|purple|sky|teal|cyan|fuchsia)-/,
  },
  {
    id: "tailwind-emerald-palette",
    why: "emerald is the `positive` token, not a Tailwind palette class",
    pattern: /\b(?:bg|text|border|from|via|to|ring|fill|stroke|shadow)-emerald-/,
  },
  {
    id: "tailwind-raw-money-palette",
    why: "money colours are the `positive` and `destructive` tokens",
    pattern:
      /\b(?:bg|text|border|from|via|to|ring|fill|stroke|shadow)-(?:red|green|amber|rose|pink|orange|yellow|lime)-/,
  },
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "out") continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      yield* walk(full);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      yield full;
    }
  }
}

const violations: string[] = [];

for (const dir of SCAN_DIRS) {
  let files: string[] = [];
  try {
    files = [...walk(join(WEB_ROOT, dir))];
  } catch {
    continue;
  }

  for (const file of files) {
    const rel = relative(WEB_ROOT, file);
    if (IGNORED_PREFIXES.some((ignored) => rel.startsWith(ignored))) continue;

    const source = readFileSync(file, "utf8");
    source.split("\n").forEach((line, index) => {
      for (const rule of RULES) {
        if (rule.pattern.test(line)) {
          violations.push(
            `${rel}:${index + 1}  [${rule.id}] ${rule.why}\n    ${line.trim()}`,
          );
        }
      }
    });
  }
}

if (violations.length > 0) {
  console.error(`✗ ${violations.length} colour violation(s) in the web app:\n`);
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}

console.log("✓ web colours: no off-token palette classes found");
