#!/usr/bin/env bun
/**
 * Syncs a change's delta specs into the main specs.
 *
 * This is the agent-driven merge: MODIFIED requirements replace the main
 * requirement wholesale (the delta carries the full updated block), ADDED
 * requirements are appended, and a capability with no main spec yet gets one
 * created from its delta.
 *
 * Run: `bun run scripts/sync-specs.ts <change-name>`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const change = process.argv[2];
if (!change) {
  console.error("usage: bun run scripts/sync-specs.ts <change-name>");
  process.exit(1);
}

const CHANGE_DIR = join(ROOT, "openspec", "changes", change);
const SPECS_DIR = join(ROOT, "openspec", "specs");

type Section = { kind: string; body: string };

/** Splits a delta spec into its `## KIND Requirements` sections. */
function splitSections(source: string): { purpose: string | null; sections: Section[] } {
  const purposeMatch = source.match(/^## Purpose\n([\s\S]*?)(?=\n## |\Z)/m);
  const purpose = purposeMatch ? purposeMatch[1].trim() : null;

  const starts: number[] = [];
  const re = /^## (MODIFIED|ADDED|REMOVED|RENAMED) Requirements$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) starts.push(match.index);

  const sections: Section[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const headerEnd = source.indexOf("\n", starts[i]);
    const kind = source
      .slice(starts[i] + 3, headerEnd)
      .replace(/Requirements$/, "")
      .trim();
    const end = i + 1 < starts.length ? starts[i + 1] : source.length;
    // A following section header can trail the body; cut it off.
    const body = source
      .slice(headerEnd + 1, end)
      .split(/^## (?:MODIFIED|ADDED|REMOVED|RENAMED) Requirements$/m)[0]
      .replace(/\s+$/, "");
    sections.push({ kind, body });
  }
  return { purpose, sections };
}

/** Splits a requirements body into `### Requirement:` blocks. */
function splitRequirements(body: string): string[] {
  const starts: number[] = [];
  const re = /^### Requirement: /gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) starts.push(match.index);

  const blocks: string[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const end = i + 1 < starts.length ? starts[i + 1] : body.length;
    // A section header can trail the last block; cut it off.
    const body_ = body.slice(starts[i], end).split(/^## (?:MODIFIED|ADDED|REMOVED|RENAMED) Requirements$/m)[0];
    const block = body_.replace(/\s+$/, "");
    if (block.trim()) blocks.push(block);
  }
  return blocks;
}

function requirementName(block: string): string {
  return block.match(/^### Requirement: (.+)$/m)![1].trim();
}

/** Writes a new main spec from a delta that has no main spec yet. */
function createMainSpec(capability: string, delta: string): string {
  const { purpose, sections } = splitSections(delta);
  const added = sections.find((s) => s.kind === "ADDED");
  const blocks = added ? splitRequirements(added.body) : [];

  const parts = [`# ${capability} Specification`, ""];
  parts.push("## Purpose", "");
  parts.push(
    purpose ??
      `TBD — Update Purpose after archive for the ${capability} capability.`,
  );
  parts.push("", "## Requirements", "");
  parts.push(blocks.join("\n\n"));
  parts.push("");
  return parts.join("\n");
}

/** Merges a delta into an existing main spec, in place. */
function mergeIntoMain(capability: string, delta: string): { main: string; changed: string[] } {
  const mainPath = join(SPECS_DIR, capability, "spec.md");
  const main = readFileSync(mainPath, "utf8");
  const { sections } = splitSections(delta);

  const changed: string[] = [];

  // The main spec's `## Requirements` section, split into blocks.
  const reqMatch = main.match(/^## Requirements\n([\s\S]*)$/m);
  if (!reqMatch) throw new Error(`${capability}: main spec has no '## Requirements' section`);
  const head = main.slice(0, reqMatch.index);
  const reqBody = reqMatch[1];

  const existing = splitRequirements(reqBody);

  const apply = (kind: string, body: string) => {
    for (const block of splitRequirements(body)) {
      const name = requirementName(block);
      const index = existing.findIndex((b) => requirementName(b) === name);
      if (kind === "MODIFIED" || kind === "REMOVED") {
        if (index === -1) {
          throw new Error(
            `${capability}: ${kind} requirement "${name}" has no counterpart in the main spec`,
          );
        }
        if (kind === "MODIFIED") {
          existing[index] = block;
          changed.push(`modified: ${name}`);
        }
      } else {
        if (index !== -1) {
          existing[index] = block;
          changed.push(`updated: ${name}`);
        } else {
          existing.push(block);
          changed.push(`added: ${name}`);
        }
      }
    }
  };

  for (const section of sections) {
    apply(section.kind, section.body);
  }

  const rebuilt = `${head}## Requirements\n\n${existing.join("\n\n")}\n`;
  return { main: rebuilt, changed };
}

const deltaDir = join(CHANGE_DIR, "specs");
let failures = 0;

for (const capability of Array.from(
  new Set(
    (existsSync(deltaDir)
      ? Array.from(new Bun.Glob("*/spec.md").scanSync({ cwd: deltaDir }))
      : []
    ).filter((p) => p.endsWith("spec.md")),
  ),
)) {
  const name = basename(dirname(capability));
  const delta = readFileSync(join(deltaDir, capability), "utf8");
  const mainPath = join(SPECS_DIR, name, "spec.md");

  if (!existsSync(mainPath)) {
    mkdirSync(join(SPECS_DIR, name), { recursive: true });
    writeFileSync(mainPath, createMainSpec(name, delta));
    const count = splitRequirements(
      splitSections(delta).sections.find((s) => s.kind === "ADDED")?.body ?? "",
    ).length;
    console.log(`✓ ${name}: new main spec created (${count} requirements)`);
    continue;
  }

  try {
    const { main, changed } = mergeIntoMain(name, delta);
    writeFileSync(mainPath, main);
    console.log(`✓ ${name}: ${changed.length} requirement(s) — ${changed.join(", ")}`);
  } catch (error) {
    console.error(`✗ ${name}: ${(error as Error).message}`);
    failures += 1;
  }
}

if (failures > 0) process.exit(1);
