#!/usr/bin/env bun
/**
 * Fails when a screen drifts away from the visual system.
 *
 * The mobile design system allows exactly one brand hue (orange), reserves
 * emerald for money received, and defines every neutral and aging colour as a
 * token. This check keeps a stray hex literal or a blue/emerald Tailwind class
 * from creeping back in.
 *
 * Run: `bun run scripts/check-visual-tokens.ts`
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_DIRS = ["app", "components", "lib", "hooks"];
const SCAN_EXTENSIONS = [".ts", ".tsx"];

/** Files that legitimately hold literal values. */
const ALLOWED_FILES = [
  "lib/theme.ts", // the token source itself
  "lib/aging.ts",
  "lib/statements.ts", // printable PDF stylesheet
  "tailwind.config.js",
  "scripts/check-visual-tokens.ts",
];

type Rule = {
  id: string;
  why: string;
  pattern: RegExp;
};

const RULES: Rule[] = [
  {
    id: "blue-or-purple",
    why: "orange is the only brand hue; blue and purple are excluded",
    pattern: /#(?:3B82F6|2563EB|1D4ED8|1E40AF|7C3AED|8B5CF6|6366F1|4F46E5|A78BFA|C084FC)\b/i,
  },
  {
    id: "tailwind-blue-purple",
    why: "use a token, not a Tailwind palette colour",
    pattern: /\b(?:bg|text|border|from|to|ring|fill)-(?:blue|indigo|violet|purple|sky|teal|cyan|fuchsia)-/,
  },
  {
    id: "tailwind-emerald-palette",
    why: "emerald is the `positive` token, not a Tailwind palette class",
    pattern: /\b(?:bg|text|border|from|to|ring|fill)-emerald-/,
  },
  {
    id: "emerald-or-amber-literal",
    why: "emerald means money received and amber is not a system colour — use the tokens",
    pattern: /#(?:10B981|34D399|F59E0B|FBBF24)\b/i,
  },
  {
    id: "off-token-grey",
    why: "use ink, ink-muted, surface, surface-raised or line",
    pattern: /#(?:525252|666666|666|777|888888|888|999999|999|AAAAAA|AAA|A0A0A0|555555|555|444444|444|2D2D2D|3D3D3D|333333|1E1E1E|1F1F1F|1A1A1A|121212|222222|CCCCCC|cccccc|888888|121212)\b/i,
  },
  {
    id: "legacy-brand-alias",
    why: "the legacy brand-* aliases were replaced by the neutral tokens",
    pattern: /\bbrand-(?:dark|card|border|muted|surface)\b/,
  },
  {
    id: "unbuilt-color-token",
    why: "a bare 'brand' or 'success' colour class is never generated; use brand-primary, brand-soft, positive, ink-muted, …",
    pattern:
      /\b(?:bg|text|border|fill|from|to|ring|divide|placeholder)-(?:brand|success)(?:\/[0-9]+)?(?![a-z0-9-])/i,
  },
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".expo" || entry === "dist") continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      yield full;
    }
  }
}

const violations: string[] = [];

for (const dir of SCAN_DIRS) {
  let files: string[] = [];
  try {
    files = [...walk(join(ROOT, dir))];
  } catch {
    continue;
  }

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (ALLOWED_FILES.includes(rel)) continue;

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
  console.error(
    `✗ ${violations.length} visual-token violation(s) in the mobile app:\n`,
  );
  for (const violation of violations) console.error(`  ${violation}\n`);
  process.exit(1);
}

console.log("✓ mobile visual tokens: no forbidden literals found");
