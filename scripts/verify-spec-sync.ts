#!/usr/bin/env bun
/**
 * Verifies that the main specs reflect every delta spec.
 *
 * A requirement's expected content is the one from the change that owns it
 * last: a MODIFIED delta supersedes an ADDED one, and among deltas of the
 * same kind the later change wins. Requirements the deltas do not mention
 * are left untouched by the sync and are expected to survive.
 *
 * Run: `bun run scripts/verify-spec-sync.ts`
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CHANGES_DIR = join(ROOT, "openspec", "changes");
const SPECS_DIR = join(ROOT, "openspec", "specs");

/** Normalises whitespace so a delta and its synced copy compare equal. */
function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n")
    .trim();
}

interface Requirement {
  kind: "MODIFIED" | "ADDED" | "REMOVED" | "RENAMED";
  body: string;
}

/** Every requirement in a spec, with the kind of section it came from. */
function parseRequirements(source: string): Map<string, Requirement> {
  const result = new Map<string, Requirement>();
  const header = /^## (MODIFIED|ADDED|REMOVED|RENAMED) Requirements$/gm;
  const headers: Array<{ kind: string; start: number; bodyStart: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = header.exec(source)) !== null) {
    headers.push({
      kind: match[1],
      start: match.index,
      bodyStart: match.index + match[0].length + 1,
    });
  }

  for (let i = 0; i < headers.length; i += 1) {
    const end = i + 1 < headers.length ? headers[i + 1].start : source.length;
    const body = source.slice(headers[i].bodyStart, end);
    const blocks = body.split(/(?=^### Requirement: )/m);
    for (const block of blocks) {
      if (!block.startsWith("### Requirement:")) continue;
      const name = block.split("\n", 1)[0].replace("### Requirement:", "").trim();
      result.set(name, {
        kind: headers[i].kind as Requirement["kind"],
        body: block,
      });
    }
  }
  return result;
}

/** The delta specs of a change, keyed by capability. */
function deltasOf(change: string): Map<string, string> {
  const dir = join(CHANGES_DIR, change, "specs");
  const result = new Map<string, string>();
  if (!existsSync(dir)) return result;
  for (const cap of Array.from(new Bun.Glob("*").scanSync({ cwd: dir, onlyDirectories: true }))) {
    const file = join(dir, cap, "spec.md");
    if (existsSync(file)) result.set(cap, readFileSync(file, "utf8"));
  }
  return result;
}

/** Changes in the order they should take precedence. */
const ORDER = [
  "refine-mobile-ux-and-visual-system",
  "audit-ui-ux-and-generate-artifacts",
  "mobile-five-screen-ui-refresh",
  "add-public-launch-features",
];

const expected = new Map<string, Map<string, { kind: string; body: string }>>();

for (const change of ORDER) {
  for (const [cap, source] of deltasOf(change)) {
    const perCap = expected.get(cap) ?? new Map();
    for (const [name, req] of parseRequirements(source)) {
      const current = perCap.get(name);
      // A MODIFIED delta supersedes an ADDED one; otherwise the later change wins.
      if (!current || (req.kind === "MODIFIED" && current.kind !== "MODIFIED")) {
        perCap.set(name, { kind: req.kind, body: req.body });
      }
    }
    expected.set(cap, perCap);
  }
}

const problems: string[] = [];

for (const [cap, requirements] of expected) {
  const mainPath = join(SPECS_DIR, cap, "spec.md");
  if (!existsSync(mainPath)) {
    problems.push(`${cap}: main spec was not created`);
    continue;
  }
  const main = parseRequirements(readFileSync(mainPath, "utf8"));

  for (const [name, want] of requirements) {
    if (want.kind === "REMOVED") {
      if (main.has(name)) problems.push(`${cap}: "${name}" should have been removed`);
      continue;
    }
    const got = main.get(name);
    if (!got) {
      problems.push(`${cap}: "${name}" is missing from the main spec`);
      continue;
    }
    if (normalize(got.body) !== normalize(want.body)) {
      problems.push(`${cap}: "${name}" does not match its delta`);
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} spec-sync problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log("✓ spec sync: every delta requirement is reflected in the main specs");
