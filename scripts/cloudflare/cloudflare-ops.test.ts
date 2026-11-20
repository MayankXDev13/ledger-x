import { describe, expect, test } from "bun:test";
import {
  extractActiveWorkerVersionId,
  extractPagesHash,
  formatDeploySummary,
  formatRollbackSummary,
  parsePagesDeployOutput,
  parseWorkerVersionId,
  selectPagesRollbackTarget,
  type CloudflarePagesDeployment,
} from "./cloudflare-ops";

describe("parseWorkerVersionId", () => {
  test("extracts Current Version ID from standard wrangler deploy output", () => {
    const log = [
      "Total Upload: 120.45 KiB / gzip: 32.10 KiB",
      "Uploaded server-v2 (2.41 sec)",
      "Deployed server-v2 triggers (0.55 sec)",
      "  https://server-v2.mayankxdev13.workers.dev",
      "Current Version ID: 4a3b2c1d-1234-4567-89ab-0123456789ef",
    ].join("\n");

    expect(parseWorkerVersionId(log)).toEqual({
      versionId: "4a3b2c1d-1234-4567-89ab-0123456789ef",
    });
  });

  test("strips ANSI codes before extracting version ID", () => {
    const log =
      "\u001b[32mCurrent Version ID:\u001b[0m \u001b[1mABCDEF12-3456-4789-ABCD-EF0123456789\u001b[0m";
    expect(parseWorkerVersionId(log)).toEqual({
      versionId: "abcdef12-3456-4789-abcd-ef0123456789",
    });
  });

  test("returns null when no version ID is present", () => {
    expect(parseWorkerVersionId("Deploy failed")).toEqual({ versionId: null });
  });
});

describe("parsePagesDeployOutput & extractPagesHash", () => {
  test("extracts unique deployment URL and hash from wrangler pages deploy output", () => {
    const log = [
      "✨ Success! Uploaded 14 files (1.22 sec)",
      "✨ Deployment complete! Take a peek over at https://8f1a2b3c.ledgerx-613.pages.dev",
    ].join("\n");

    expect(parsePagesDeployOutput(log)).toEqual({
      deploymentUrl: "https://8f1a2b3c.ledgerx-613.pages.dev",
      deploymentHash: "8f1a2b3c",
    });
  });

  test("extracts hash from Pages deployment URL and ignores bare production URL", () => {
    expect(extractPagesHash("https://a1b2c3d4.ledgerx-613.pages.dev")).toBe("a1b2c3d4");
    expect(extractPagesHash("https://ledgerx-613.pages.dev")).toBeNull();
    expect(extractPagesHash("https://example.com")).toBeNull();
  });
});

describe("extractActiveWorkerVersionId", () => {
  test("extracts active version from wrangler deployments list --json", () => {
    const payload = JSON.stringify([
      {
        id: "dep-old",
        created_on: "2026-11-19T10:00:00.000Z",
        versions: [
          { version_id: "11111111-1111-4111-8111-111111111111", percentage: 100 },
        ],
      },
      {
        id: "dep-new",
        created_on: "2026-11-20T10:00:00.000Z",
        versions: [
          { version_id: "22222222-2222-4222-8222-222222222222", percentage: 100 },
        ],
      },
    ]);

    expect(extractActiveWorkerVersionId(payload)).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
  });

  test("extracts latest version from wrangler versions list --json", () => {
    const payload = JSON.stringify([
      {
        id: "33333333-3333-4333-8333-333333333333",
        metadata: { created_on: "2026-11-20T12:00:00.000Z" },
      },
    ]);

    expect(extractActiveWorkerVersionId(payload)).toBe(
      "33333333-3333-4333-8333-333333333333",
    );
  });
});

describe("selectPagesRollbackTarget", () => {
  const deployments: CloudflarePagesDeployment[] = [
    {
      id: "aaaa1111-1111-4111-8111-111111111111",
      short_id: "aaaa1111",
      url: "https://aaaa1111.ledgerx-613.pages.dev",
      environment: "production",
      latest_stage: { name: "deploy", status: "success" },
    },
    {
      id: "bbbb2222-2222-4222-8222-222222222222",
      short_id: "bbbb2222",
      url: "https://bbbb2222.ledgerx-613.pages.dev",
      environment: "production",
      latest_stage: { name: "deploy", status: "failure" },
    },
    {
      id: "cccc3333-3333-4333-8333-333333333333",
      short_id: "cccc3333",
      url: "https://cccc3333.ledgerx-613.pages.dev",
      environment: "production",
      latest_stage: { name: "deploy", status: "success" },
    },
  ];

  test("automatically selects previous successful production deployment", () => {
    const target = selectPagesRollbackTarget(deployments, {
      canonicalDeploymentId: "aaaa1111-1111-4111-8111-111111111111",
    });
    expect(target.id).toBe("cccc3333-3333-4333-8333-333333333333");
  });

  test("matches requested target by unique hash or full UUID", () => {
    expect(
      selectPagesRollbackTarget(deployments, { requestedTarget: "cccc3333" }).id,
    ).toBe("cccc3333-3333-4333-8333-333333333333");

    expect(
      selectPagesRollbackTarget(deployments, {
        requestedTarget: "aaaa1111-1111-4111-8111-111111111111",
      }).id,
    ).toBe("aaaa1111-1111-4111-8111-111111111111");
  });

  test("throws when requested target does not exist", () => {
    expect(() =>
      selectPagesRollbackTarget(deployments, { requestedTarget: "deadbeef" }),
    ).toThrow(/No production Cloudflare Pages deployment matched/);
  });
});

describe("summary formatters", () => {
  test("formatDeploySummary includes Worker Version ID, Pages hash, and rollback commands", () => {
    const md = formatDeploySummary({
      repository: "MayankXDev13/ledger-x",
      sha: "092fc4d1234567890abcdef",
      runId: "99999",
      runNumber: "42",
      api: {
        deployed: true,
        outcome: "success",
        versionId: "4a3b2c1d-1234-4567-89ab-0123456789ef",
        previousVersionId: "11111111-1111-4111-8111-111111111111",
        url: "https://server-v2.mayankxdev13.workers.dev",
      },
      web: {
        deployed: true,
        outcome: "success",
        deploymentId: "cccc3333-3333-4333-8333-333333333333",
        deploymentHash: "8f1a2b3c",
        deploymentUrl: "https://8f1a2b3c.ledgerx-613.pages.dev",
        productionUrl: "https://ledgerx-613.pages.dev",
        previousDeploymentId: "aaaa1111-1111-4111-8111-111111111111",
        previousDeploymentHash: "aaaa1111",
        projectName: "ledgerx-613",
      },
    });

    expect(md).toContain("4a3b2c1d-1234-4567-89ab-0123456789ef");
    expect(md).toContain("8f1a2b3c");
    expect(md).toContain("cccc3333-3333-4333-8333-333333333333");
    expect(md).toContain("actions/workflows/rollback.yml");
    expect(md).toContain("wrangler rollback 11111111-1111-4111-8111-111111111111 --yes");
    expect(md).toContain("pages-rollback --project ledgerx-613 --target aaaa1111");
  });

  test("formatRollbackSummary renders rolled-back targets", () => {
    const md = formatRollbackSummary({
      repository: "MayankXDev13/ledger-x",
      runId: "100001",
      reason: "500 spike on /customers",
      api: {
        executed: true,
        outcome: "success",
        requestedVersionId: "11111111-1111-4111-8111-111111111111",
        activeVersionId: "11111111-1111-4111-8111-111111111111",
        url: "https://server-v2.mayankxdev13.workers.dev",
      },
      web: {
        executed: true,
        outcome: "success",
        requestedTarget: "",
        activeDeploymentId: "aaaa1111-1111-4111-8111-111111111111",
        activeDeploymentHash: "aaaa1111",
        activeDeploymentUrl: "https://aaaa1111.ledgerx-613.pages.dev",
        productionUrl: "https://ledgerx-613.pages.dev",
      },
    });

    expect(md).toContain("500 spike on /customers");
    expect(md).toContain("11111111-1111-4111-8111-111111111111");
    expect(md).toContain("aaaa1111");
  });
});
