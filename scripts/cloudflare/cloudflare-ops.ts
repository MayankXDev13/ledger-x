#!/usr/bin/env bun
/**
 * Cloudflare deployment version tracking, Pages rollback, and GitHub summary helpers.
 *
 * Used by `.github/workflows/deploy.yml` and `.github/workflows/rollback.yml`,
 * and runnable locally with Bun for instant rollbacks or status checks.
 */

import { appendFileSync, readFileSync } from "node:fs";

const ANSI_REGEX = /\u001B\[[0-?]*[ -/]*[@-~]/g;
const UUID_REGEX =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export interface WorkerDeployParseResult {
  versionId: string | null;
}

export interface PagesDeployParseResult {
  deploymentUrl: string | null;
  deploymentHash: string | null;
}

export interface CloudflarePagesDeployment {
  id: string;
  short_id?: string;
  url?: string;
  environment?: string;
  aliases?: string[];
  created_on?: string;
  is_skipped?: boolean;
  latest_stage?: {
    name?: string;
    status?: string;
  };
  deployment_trigger?: {
    metadata?: {
      commit_hash?: string;
      commit_message?: string;
      branch?: string;
    };
  };
}

export interface PagesDeploymentInfo {
  deploymentId: string;
  deploymentHash: string;
  deploymentUrl: string;
  productionUrl: string;
  commitHash: string;
  createdOn: string;
}

export interface DeploySummaryInput {
  repository: string;
  sha: string;
  runId: string;
  runNumber: string;
  api: {
    deployed: boolean;
    outcome: string;
    versionId: string;
    previousVersionId: string;
    url: string;
  };
  web: {
    deployed: boolean;
    outcome: string;
    deploymentId: string;
    deploymentHash: string;
    deploymentUrl: string;
    productionUrl: string;
    previousDeploymentId: string;
    previousDeploymentHash: string;
    projectName: string;
  };
}

export interface RollbackSummaryInput {
  repository: string;
  runId: string;
  reason: string;
  api: {
    executed: boolean;
    outcome: string;
    requestedVersionId: string;
    activeVersionId: string;
    url: string;
  };
  web: {
    executed: boolean;
    outcome: string;
    requestedTarget: string;
    activeDeploymentId: string;
    activeDeploymentHash: string;
    activeDeploymentUrl: string;
    productionUrl: string;
  };
}

export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEX, "");
}

export function parseWorkerVersionId(rawLog: string): WorkerDeployParseResult {
  const text = stripAnsi(rawLog);
  const patterns = [
    new RegExp(`Current\\s+Version\\s+ID:\\s*(${UUID_REGEX})`, "i"),
    new RegExp(`Worker\\s+Version\\s+ID:\\s*(${UUID_REGEX})`, "i"),
    new RegExp(`Version\\s+ID:\\s*(${UUID_REGEX})`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return { versionId: match[1].toLowerCase() };
    }
  }

  return { versionId: null };
}

export function extractPagesHash(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname;
    // Standard Cloudflare Pages deployment URL: https://<hash>.<project>.pages.dev
    if (!host.endsWith(".pages.dev")) return null;
    const labels = host.slice(0, -".pages.dev".length).split(".");
    if (labels.length >= 2 && labels[0]) {
      return labels[0].toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

export function parsePagesDeployOutput(rawLog: string): PagesDeployParseResult {
  const text = stripAnsi(rawLog);
  const matches = [...text.matchAll(/https:\/\/([a-z0-9-]+)\.([a-z0-9-]+)\.pages\.dev\b/gi)];

  // Prefer the first unique deployment URL (<hash>.<project>.pages.dev).
  for (const match of matches) {
    const fullUrl = match[0];
    const hash = match[1]?.toLowerCase() ?? null;
    if (hash) {
      return {
        deploymentUrl: fullUrl,
        deploymentHash: hash,
      };
    }
  }

  return { deploymentUrl: null, deploymentHash: null };
}

export function extractActiveWorkerVersionId(rawJson: string): string | null {
  if (!rawJson.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }

  // Shape 1: `wrangler deployments list --json` -> array of deployments, newest last or first.
  // Each deployment has `versions: [{ version_id, percentage }]` and `created_on`.
  if (Array.isArray(parsed) && parsed.length > 0) {
    const sorted = [...parsed].sort((a, b) => {
      const ta = Date.parse(
        (a as { created_on?: string; metadata?: { created_on?: string } })?.created_on ??
          (a as { metadata?: { created_on?: string } })?.metadata?.created_on ??
          "",
      );
      const tb = Date.parse(
        (b as { created_on?: string; metadata?: { created_on?: string } })?.created_on ??
          (b as { metadata?: { created_on?: string } })?.metadata?.created_on ??
          "",
      );
      if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
      return tb - ta;
    });

    for (const item of sorted) {
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        if (Array.isArray(rec.versions) && rec.versions.length > 0) {
          const versions = [...(rec.versions as Array<{ version_id?: string; percentage?: number }>)].sort(
            (a, b) => (b.percentage ?? 0) - (a.percentage ?? 0),
          );
          const top = versions[0]?.version_id;
          if (typeof top === "string" && top.length > 0) {
            return top.toLowerCase();
          }
        }
        // Shape 2: `wrangler versions list --json` -> array of `{ id: "<uuid>", ... }`
        if (typeof rec.id === "string" && new RegExp(`^${UUID_REGEX}$`, "i").test(rec.id)) {
          return rec.id.toLowerCase();
        }
      }
    }
  }

  // Shape 3: `{ items: [...] }` or `{ deployments: [...] }`
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const rec = parsed as Record<string, unknown>;
    const list = rec.deployments ?? rec.items ?? rec.result;
    if (Array.isArray(list)) {
      return extractActiveWorkerVersionId(JSON.stringify(list));
    }
  }

  return null;
}

export function isSuccessfulPagesDeployment(d: CloudflarePagesDeployment): boolean {
  if (d.is_skipped) return false;
  const stageStatus = d.latest_stage?.status?.toLowerCase();
  // Cloudflare returns `success` when the deployment completed.
  return stageStatus === "success";
}

export function normalizePagesDeployment(
  d: CloudflarePagesDeployment,
  fallbackProductionUrl: string,
): PagesDeploymentInfo {
  const deploymentUrl = d.url ?? fallbackProductionUrl;
  const deploymentHash =
    extractPagesHash(d.url) ??
    (d.short_id ? d.short_id.toLowerCase() : d.id.slice(0, 8).toLowerCase());
  const productionUrl =
    d.aliases?.find((a) => a.startsWith("https://")) ?? fallbackProductionUrl;

  return {
    deploymentId: d.id,
    deploymentHash,
    deploymentUrl,
    productionUrl,
    commitHash: d.deployment_trigger?.metadata?.commit_hash ?? "",
    createdOn: d.created_on ?? "",
  };
}

export function selectPagesRollbackTarget(
  deployments: CloudflarePagesDeployment[],
  options: {
    requestedTarget?: string;
    canonicalDeploymentId?: string | null;
  } = {},
): CloudflarePagesDeployment {
  const productionDeployments = deployments.filter(
    (d) => !d.environment || d.environment === "production",
  );

  const requested = options.requestedTarget?.trim().toLowerCase();
  if (requested) {
    const match = productionDeployments.find((d) => {
      const id = d.id.toLowerCase();
      const shortId = d.short_id?.toLowerCase() ?? "";
      const hash = extractPagesHash(d.url) ?? "";
      return (
        id === requested ||
        id.startsWith(requested) ||
        shortId === requested ||
        hash === requested
      );
    });
    if (!match) {
      throw new Error(
        `No production Cloudflare Pages deployment matched "${options.requestedTarget}".`,
      );
    }
    return match;
  }

  // Automatic rollback: pick the most recent successful production deployment
  // that is NOT the currently active canonical deployment.
  const activeId = (
    options.canonicalDeploymentId ?? productionDeployments[0]?.id ?? ""
  ).toLowerCase();

  const previous = productionDeployments.find(
    (d) => d.id.toLowerCase() !== activeId && isSuccessfulPagesDeployment(d),
  );

  if (!previous) {
    throw new Error(
      "No previous successful production Cloudflare Pages deployment found to roll back to.",
    );
  }

  return previous;
}

function statusBadge(deployed: boolean, outcome: string): string {
  if (!deployed) return "Skipped";
  if (outcome === "success") return "Live (Succeeded)";
  if (outcome === "failure") return "Failed (Auto-rollback attempted)";
  if (outcome === "cancelled") return "Cancelled";
  return outcome || "Unknown";
}

export function formatDeploySummary(input: DeploySummaryInput): string {
  const shortSha = input.sha.slice(0, 7);
  const rollbackWorkflowUrl = `https://github.com/${input.repository}/actions/workflows/rollback.yml`;
  const commitUrl = `https://github.com/${input.repository}/commit/${input.sha}`;
  const runUrl = `https://github.com/${input.repository}/actions/runs/${input.runId}`;

  const lines: string[] = [
    `## Production Deployment Summary`,
    ``,
    `- **Commit:** [\`${shortSha}\`](${commitUrl}) (\`${input.sha}\`)`,
    `- **Workflow Run:** [#${input.runNumber}](${runUrl})`,
    ``,
    `### Running Versions`,
    ``,
    `| Target | Status | Live Version / Hash | Live URL | Previous Version / Hash |`,
    `| --- | --- | --- | --- | --- |`,
  ];

  if (input.api.deployed) {
    const verDisplay = input.api.versionId ? `\`${input.api.versionId}\`` : "_unavailable_";
    const prevDisplay = input.api.previousVersionId
      ? `\`${input.api.previousVersionId}\``
      : "_none_";
    const urlDisplay = input.api.url ? `[${input.api.url}](${input.api.url})` : "_n/a_";
    lines.push(
      `| **API (Cloudflare Workers)** | ${statusBadge(true, input.api.outcome)} | ${verDisplay} | ${urlDisplay} | ${prevDisplay} |`,
    );
  } else {
    lines.push(`| **API (Cloudflare Workers)** | Skipped | — | — | — |`);
  }

  if (input.web.deployed) {
    const hashPart = input.web.deploymentHash ? `\`${input.web.deploymentHash}\`` : "_unavailable_";
    const idPart = input.web.deploymentId ? ` (\`${input.web.deploymentId}\`)` : "";
    const prevPart = input.web.previousDeploymentHash
      ? `\`${input.web.previousDeploymentHash}\`${input.web.previousDeploymentId ? ` (\`${input.web.previousDeploymentId}\`)` : ""}`
      : input.web.previousDeploymentId
        ? `\`${input.web.previousDeploymentId}\``
        : "_none_";
    const prodUrl = input.web.productionUrl || input.web.deploymentUrl;
    const urlLinks: string[] = [];
    if (prodUrl) urlLinks.push(`[Production](${prodUrl})`);
    if (input.web.deploymentUrl && input.web.deploymentUrl !== prodUrl) {
      urlLinks.push(`[Hash URL](${input.web.deploymentUrl})`);
    }
    lines.push(
      `| **Web (Cloudflare Pages)** | ${statusBadge(true, input.web.outcome)} | ${hashPart}${idPart} | ${urlLinks.join(" · ") || "_n/a_"} | ${prevPart} |`,
    );
  } else {
    lines.push(`| **Web (Cloudflare Pages)** | Skipped | — | — | — |`);
  }

  lines.push(
    ``,
    `### Instant Rollback`,
    ``,
    `If an error occurs in production, roll back immediately via [**Rollback Production Workflow**](${rollbackWorkflowUrl}) (leave version/deployment inputs blank to revert to the previous healthy version, or paste a specific ID/hash):`,
    ``,
  );

  if (input.api.deployed) {
    const rollbackTarget = input.api.previousVersionId || "<version-id>";
    lines.push(
      `- **API (Workers):** Trigger \`Rollback Production\` with \`target: api\`${input.api.previousVersionId ? ` and \`worker_version_id: ${input.api.previousVersionId}\`` : ""} — or locally:`,
      `  \`\`\`bash`,
      `  bun x --cwd apps/api wrangler rollback ${rollbackTarget} --yes --message "Rollback from ${shortSha}"`,
      `  \`\`\``,
    );
  }

  if (input.web.deployed) {
    const pagesTarget =
      input.web.previousDeploymentHash || input.web.previousDeploymentId || "";
    const project = input.web.projectName || "ledgerx";
    lines.push(
      `- **Web (Pages):** Trigger \`Rollback Production\` with \`target: web\`${pagesTarget ? ` and \`pages_deployment_id: ${pagesTarget}\`` : ""} — or locally:`,
      `  \`\`\`bash`,
      `  bun run scripts/cloudflare/cloudflare-ops.ts pages-rollback --project ${project}${pagesTarget ? ` --target ${pagesTarget}` : ""}`,
      `  \`\`\``,
    );
  }

  return `${lines.join("\n")}\n`;
}

export function formatRollbackSummary(input: RollbackSummaryInput): string {
  const runUrl = `https://github.com/${input.repository}/actions/runs/${input.runId}`;
  const lines: string[] = [
    `## Production Rollback Summary`,
    ``,
    `- **Reason:** ${input.reason || "Manual production rollback"}`,
    `- **Workflow Run:** [View logs](${runUrl})`,
    ``,
    `| Target | Status | Requested Target | Active Version / Hash Now Running | Live URL |`,
    `| --- | --- | --- | --- | --- |`,
  ];

  if (input.api.executed) {
    const req = input.api.requestedVersionId
      ? `\`${input.api.requestedVersionId}\``
      : "_previous version_";
    const active = input.api.activeVersionId
      ? `\`${input.api.activeVersionId}\``
      : "_check Cloudflare dashboard_";
    const url = input.api.url ? `[${input.api.url}](${input.api.url})` : "_n/a_";
    lines.push(
      `| **API (Cloudflare Workers)** | ${input.api.outcome === "success" ? "Rolled Back" : `Failed (${input.api.outcome})`} | ${req} | ${active} | ${url} |`,
    );
  }

  if (input.web.executed) {
    const req = input.web.requestedTarget
      ? `\`${input.web.requestedTarget}\``
      : "_previous production deployment_";
    const active = input.web.activeDeploymentHash
      ? `\`${input.web.activeDeploymentHash}\`${input.web.activeDeploymentId ? ` (\`${input.web.activeDeploymentId}\`)` : ""}`
      : input.web.activeDeploymentId
        ? `\`${input.web.activeDeploymentId}\``
        : "_check Cloudflare dashboard_";
    const url = input.web.productionUrl || input.web.activeDeploymentUrl;
    const urlDisplay = url ? `[${url}](${url})` : "_n/a_";
    lines.push(
      `| **Web (Cloudflare Pages)** | ${input.web.outcome === "success" ? "Rolled Back" : `Failed (${input.web.outcome})`} | ${req} | ${active} | ${urlDisplay} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Cloudflare REST API helpers
// ---------------------------------------------------------------------------

interface CfApiResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
}

interface CfPagesProject {
  name: string;
  subdomain?: string;
  domains?: string[];
  canonical_deployment?: CloudflarePagesDeployment | null;
}

async function cfRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json()) as CfApiResponse<T>;
  if (!res.ok || !body.success) {
    const details =
      body.errors?.map((e) => `[${e.code}] ${e.message}`).join("; ") ||
      `HTTP ${res.status}`;
    throw new Error(`Cloudflare API error on ${path}: ${details}`);
  }
  return body.result;
}

async function fetchPagesState(accountId: string, project: string, token: string) {
  const [projectInfo, deployments] = await Promise.all([
    cfRequest<CfPagesProject>(
      `/accounts/${accountId}/pages/projects/${project}`,
      token,
    ),
    cfRequest<CloudflarePagesDeployment[]>(
      `/accounts/${accountId}/pages/projects/${project}/deployments?env=production&per_page=25`,
      token,
    ),
  ]);

  const fallbackProductionUrl = projectInfo.subdomain
    ? `https://${projectInfo.subdomain}`
    : `https://${project}.pages.dev`;

  return {
    projectInfo,
    deployments,
    fallbackProductionUrl,
  };
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function writeGithubOutputs(values: Record<string, string>) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v.replace(/\r?\n/g, " ")}`);
  appendFileSync(outputPath, `${lines.join("\n")}\n`);
}

function requireCloudflareCredentials(flags: Record<string, string>) {
  const accountId = flags["account-id"] || process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const token = process.env.CLOUDFLARE_API_TOKEN || "";
  const project = flags.project || process.env.CLOUDFLARE_PAGES_PROJECT || "ledgerx";

  if (!accountId) throw new Error("Missing CLOUDFLARE_ACCOUNT_ID (or --account-id).");
  if (!token) throw new Error("Missing CLOUDFLARE_API_TOKEN environment variable.");

  return { accountId, token, project };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseFlags(rest);
  const emitGh = flags["github-output"] === "true";

  switch (command) {
    case "parse-worker-deploy": {
      const logFile = positional[0];
      if (!logFile) throw new Error("Usage: parse-worker-deploy <log-file>");
      const raw = readFileSync(logFile, "utf8");
      const result = parseWorkerVersionId(raw);
      if (emitGh) {
        writeGithubOutputs({ version_id: result.versionId ?? "" });
      }
      console.log(JSON.stringify(result));
      return;
    }

    case "parse-worker-active": {
      const jsonFile = positional[0];
      const raw = jsonFile ? readFileSync(jsonFile, "utf8") : await Bun.stdin.text();
      const versionId = extractActiveWorkerVersionId(raw);
      if (emitGh) {
        writeGithubOutputs({ version_id: versionId ?? "" });
      }
      console.log(JSON.stringify({ versionId }));
      return;
    }

    case "parse-pages-deploy": {
      const logFile = positional[0];
      if (!logFile) throw new Error("Usage: parse-pages-deploy <log-file>");
      const raw = readFileSync(logFile, "utf8");
      const result = parsePagesDeployOutput(raw);
      if (emitGh) {
        writeGithubOutputs({
          deployment_url: result.deploymentUrl ?? "",
          deployment_hash: result.deploymentHash ?? "",
        });
      }
      console.log(JSON.stringify(result));
      return;
    }

    case "pages-current": {
      const { accountId, token, project } = requireCloudflareCredentials(flags);
      const { projectInfo, deployments, fallbackProductionUrl } = await fetchPagesState(
        accountId,
        project,
        token,
      );
      const current =
        projectInfo.canonical_deployment ??
        deployments.find((d) => isSuccessfulPagesDeployment(d)) ??
        deployments[0] ??
        null;

      if (!current) {
        if (emitGh) {
          writeGithubOutputs({
            deployment_id: "",
            deployment_hash: "",
            deployment_url: "",
            production_url: fallbackProductionUrl,
          });
        }
        console.log(JSON.stringify({ current: null, productionUrl: fallbackProductionUrl }));
        return;
      }

      const info = normalizePagesDeployment(current, fallbackProductionUrl);
      if (emitGh) {
        writeGithubOutputs({
          deployment_id: info.deploymentId,
          deployment_hash: info.deploymentHash,
          deployment_url: info.deploymentUrl,
          production_url: info.productionUrl,
        });
      }
      console.log(JSON.stringify(info));
      return;
    }

    case "pages-find-deployment": {
      const { accountId, token, project } = requireCloudflareCredentials(flags);
      const { projectInfo, deployments, fallbackProductionUrl } = await fetchPagesState(
        accountId,
        project,
        token,
      );

      const targetHash = (flags.hash || extractPagesHash(flags.url) || "").toLowerCase();
      const targetCommit = (flags.commit || "").toLowerCase();

      const matched =
        deployments.find(
          (d) => targetHash && (extractPagesHash(d.url) ?? "") === targetHash,
        ) ??
        deployments.find(
          (d) =>
            targetCommit &&
            (d.deployment_trigger?.metadata?.commit_hash ?? "").toLowerCase() === targetCommit,
        ) ??
        projectInfo.canonical_deployment ??
        deployments[0];

      if (!matched) {
        throw new Error(`Could not find any production deployment for Pages project "${project}".`);
      }

      const info = normalizePagesDeployment(matched, fallbackProductionUrl);
      if (emitGh) {
        writeGithubOutputs({
          deployment_id: info.deploymentId,
          deployment_hash: info.deploymentHash,
          deployment_url: info.deploymentUrl,
          production_url: info.productionUrl,
        });
      }
      console.log(JSON.stringify(info));
      return;
    }

    case "pages-rollback": {
      const { accountId, token, project } = requireCloudflareCredentials(flags);
      const { projectInfo, deployments, fallbackProductionUrl } = await fetchPagesState(
        accountId,
        project,
        token,
      );

      const target = selectPagesRollbackTarget(deployments, {
        requestedTarget: flags.target,
        canonicalDeploymentId: projectInfo.canonical_deployment?.id ?? null,
      });

      const rolledBack = await cfRequest<CloudflarePagesDeployment>(
        `/accounts/${accountId}/pages/projects/${project}/deployments/${target.id}/rollback`,
        token,
        { method: "POST" },
      );

      const info = normalizePagesDeployment(rolledBack ?? target, fallbackProductionUrl);
      if (emitGh) {
        writeGithubOutputs({
          deployment_id: info.deploymentId,
          deployment_hash: info.deploymentHash,
          deployment_url: info.deploymentUrl,
          production_url: info.productionUrl,
          commit_hash: info.commitHash,
        });
      }
      console.log(JSON.stringify(info));
      return;
    }

    case "format-deploy-summary": {
      const summary = formatDeploySummary({
        repository: process.env.GITHUB_REPOSITORY || "",
        sha: process.env.DEPLOY_SHA || "",
        runId: process.env.GITHUB_RUN_ID || "",
        runNumber: process.env.GITHUB_RUN_NUMBER || "",
        api: {
          deployed: process.env.API_DEPLOYED === "true",
          outcome: process.env.API_OUTCOME || "",
          versionId: process.env.API_VERSION_ID || "",
          previousVersionId: process.env.API_PREVIOUS_VERSION_ID || "",
          url: process.env.API_URL || "",
        },
        web: {
          deployed: process.env.WEB_DEPLOYED === "true",
          outcome: process.env.WEB_OUTCOME || "",
          deploymentId: process.env.WEB_DEPLOYMENT_ID || "",
          deploymentHash: process.env.WEB_DEPLOYMENT_HASH || "",
          deploymentUrl: process.env.WEB_DEPLOYMENT_URL || "",
          productionUrl: process.env.WEB_PRODUCTION_URL || "",
          previousDeploymentId: process.env.WEB_PREVIOUS_DEPLOYMENT_ID || "",
          previousDeploymentHash: process.env.WEB_PREVIOUS_DEPLOYMENT_HASH || "",
          projectName: process.env.CLOUDFLARE_PAGES_PROJECT || "ledgerx",
        },
      });
      if (flags["write-summary"] === "true" && process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
      }
      process.stdout.write(summary);
      return;
    }

    case "format-rollback-summary": {
      const summary = formatRollbackSummary({
        repository: process.env.GITHUB_REPOSITORY || "",
        runId: process.env.GITHUB_RUN_ID || "",
        reason: process.env.ROLLBACK_REASON || "Manual production rollback",
        api: {
          executed: process.env.API_EXECUTED === "true",
          outcome: process.env.API_OUTCOME || "",
          requestedVersionId: process.env.API_REQUESTED_VERSION_ID || "",
          activeVersionId: process.env.API_ACTIVE_VERSION_ID || "",
          url: process.env.API_URL || "",
        },
        web: {
          executed: process.env.WEB_EXECUTED === "true",
          outcome: process.env.WEB_OUTCOME || "",
          requestedTarget: process.env.WEB_REQUESTED_TARGET || "",
          activeDeploymentId: process.env.WEB_ACTIVE_DEPLOYMENT_ID || "",
          activeDeploymentHash: process.env.WEB_ACTIVE_DEPLOYMENT_HASH || "",
          activeDeploymentUrl: process.env.WEB_ACTIVE_DEPLOYMENT_URL || "",
          productionUrl: process.env.WEB_PRODUCTION_URL || "",
        },
      });
      if (flags["write-summary"] === "true" && process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
      }
      process.stdout.write(summary);
      return;
    }

    default:
      throw new Error(
        `Unknown command "${command ?? ""}". Expected one of: parse-worker-deploy, parse-worker-active, parse-pages-deploy, pages-current, pages-find-deployment, pages-rollback, format-deploy-summary, format-rollback-summary.`,
      );
  }
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cloudflare-ops] ${message}`);
    process.exit(1);
  });
}
