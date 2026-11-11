#!/usr/bin/env bun
/**
 * Fails when the web app references a design token that does not exist.
 *
 * The audit found ~24 primary call to action rendering with no background
 * because `bg-gradient-brand` referenced `--brand` and `--brand-light`, which
 * were never declared. This check parses the stylesheet and the compiled
 * build, and fails on any custom property or custom utility class that is
 * used but not declared.
 *
 * Run: `bun run scripts/check-web-tokens.ts`
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WEB_ROOT = new URL("../apps/web", import.meta.url).pathname;

/** Files that legitimately declare tokens or use third-party classes. */
const IGNORED_SOURCES = ["components/ui/", "node_modules/", ".next/", "out/"];

/** Utility classes Tailwind provides; these are never declared by hand. */
const BUILTIN_PREFIXES = [
  "bg-",
  "text-",
  "border-",
  "rounded-",
  "p-",
  "px-",
  "py-",
  "pt-",
  "pb-",
  "m-",
  "mx-",
  "my-",
  "mt-",
  "mb-",
  "ml-",
  "mr-",
  "gap-",
  "flex",
  "grid",
  "w-",
  "h-",
  "min-",
  "max-",
  "text-",
  "font-",
  "leading-",
  "tracking-",
  "opacity-",
  "z-",
  "top-",
  "bottom-",
  "left-",
  "right-",
  "inset-",
  "space-",
  "col-",
  "row-",
  "items-",
  "justify-",
  "self-",
  "place-",
  "overflow-",
  "hidden",
  "block",
  "inline",
  "absolute",
  "relative",
  "sticky",
  "fixed",
  "static",
  "cursor-",
  "select-",
  "pointer-",
  "transition",
  "duration-",
  "ease-",
  "delay-",
  "animate-",
  "scale-",
  "rotate-",
  "translate-",
  "shadow",
  "ring",
  "outline",
  "divide-",
  "placeholder-",
  "decoration-",
  "accent-",
  "caret-",
  "list-",
  "sr-only",
  "not-sr-only",
  "resize",
  "truncate",
  "uppercase",
  "lowercase",
  "capitalize",
  "italic",
  "underline",
  "line-through",
  "no-underline",
  "whitespace-",
  "break-",
  "object-",
  "aspect-",
  "basis-",
  "grow",
  "shrink",
  "order-",
  "col-span",
  "row-span",
  "sr-only",
  "group",
  "peer",
  "container",
  "prose",
  "backdrop-",
  "mix-blend-",
  "bg-opacity",
  "from-",
  "via-",
  "to-",
];

/** Collects the custom properties a stylesheet declares. */
function declaredCustomProperties(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    names.add(match[1]);
  }
  return names;
}

/** Collects the custom properties a stylesheet references. */
function referencedCustomProperties(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    names.add(match[1]);
  }
  return names;
}

/** Custom utility classes: a class the app defines itself, not a Tailwind one. */
function customUtilityClasses(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of css.matchAll(/\.(-?[a-z][a-z0-9-]*)\s*\{/gi)) {
    const name = match[1];
    const bare = name.replace(/^-/, "");
    if (BUILTIN_PREFIXES.some((prefix) => bare.startsWith(prefix))) continue;
    // Only look at names that look like the app's own kebab-case utilities.
    if (!name.includes("-")) continue;
    names.add(name);
  }
  return names;
}

const violations: string[] = [];

/* 1. The stylesheet must not reference an undeclared custom property. */
const sourceCss = join(WEB_ROOT, "app", "globals.css");
if (!existsSync(sourceCss)) {
  console.error(`✗ missing ${sourceCss}`);
  process.exit(1);
}

const css = readFileSync(sourceCss, "utf8");
const declared = declaredCustomProperties(css);
const referenced = referencedCustomProperties(css);

for (const name of referenced) {
  if (!declared.has(name)) {
    violations.push(`globals.css references ${name}, which is never declared`);
  }
}

/* 2. The compiled build must declare the brand ramp. */
const compiledDirs = [
  join(WEB_ROOT, ".next", "static", "chunks"),
  join(WEB_ROOT, "out", "_next", "static", "chunks"),
];
let compiled = "";
for (const dir of compiledDirs) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".css")) continue;
    compiled += readFileSync(join(dir, file), "utf8");
  }
}

if (compiled) {
  const compiledDeclared = declaredCustomProperties(compiled);
  for (const required of [
    "--brand",
    "--brand-light",
    "--brand-fill",
    "--brand-deep",
    "--brand-text",
    "--positive",
  ]) {
    if (!compiledDeclared.has(required)) {
      violations.push(`the built stylesheet does not declare ${required}`);
    }
  }

  /* 3. A custom utility used in the source must exist in the built CSS. */
  const builtUtilities = customUtilityClasses(compiled);
  const sourceFiles: string[] = [];
  const collect = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        collect(full);
      } else if (/\.tsx?$/.test(entry)) {
        sourceFiles.push(full);
      }
    }
  };
  collect(join(WEB_ROOT, "app"));
  collect(join(WEB_ROOT, "components"));

  for (const file of sourceFiles) {
    const rel = relative(WEB_ROOT, file);
    if (IGNORED_SOURCES.some((ignored) => rel.startsWith(ignored))) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/className="([^"]*)"/g)) {
      for (const token of match[1].split(/\s+/)) {
        const name = token.replace(/^[a-z0-9]+:/, "");
        if (!name || name.includes("[") || name.includes(":")) continue;
        const bare = name.replace(/^-/, "");
        if (!bare.includes("-")) continue;
        if (BUILTIN_PREFIXES.some((prefix) => bare.startsWith(prefix))) continue;
        if (!builtUtilities.has(name)) {
          violations.push(`${rel} uses .${name}, which is not defined in the stylesheet`);
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`✗ ${violations.length} token violation(s):\n`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log("✓ web tokens: every referenced token and utility is declared");
