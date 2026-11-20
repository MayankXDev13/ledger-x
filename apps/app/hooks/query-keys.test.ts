import { describe, expect, test } from "bun:test";
import {
  collectionKeys,
  customerKeys,
  dashboardKeys,
  featureFlagKeys,
  settingsKeys,
  statementKeys,
  transactionKeys,
} from "./query-keys";

describe("mobile query key factories", () => {
  test("dashboard keys share a common prefix", () => {
    expect(dashboardKeys.all).toEqual(["dashboard"]);
    expect(dashboardKeys.metrics()).toEqual(["dashboard", "metrics"]);
    expect(dashboardKeys.recentTransactions()).toEqual([
      "dashboard",
      "recent-transactions",
    ]);
    expect(dashboardKeys.analytics()).toEqual(["dashboard", "analytics"]);
  });

  test("customer keys scope list, balances, and detail under customers", () => {
    expect(customerKeys.all).toEqual(["customers"]);
    expect(customerKeys.lists()).toEqual(["customers", "list"]);
    expect(customerKeys.balances()).toEqual(["customers", "balances"]);
    expect(customerKeys.detail("c-1")).toEqual(["customers", "detail", "c-1"]);
  });

  test("transaction keys support optional filter params cleanly", () => {
    expect(transactionKeys.byCustomer("c-1")).toEqual([
      "transactions",
      "customer",
      "c-1",
    ]);
    expect(transactionKeys.byCustomer("c-1", { page: 2 })).toEqual([
      "transactions",
      "customer",
      "c-1",
      { page: 2 },
    ]);
    expect(transactionKeys.byCustomerInfinite("c-1")).toEqual([
      "transactions",
      "customer-infinite",
      "c-1",
    ]);
    expect(
      transactionKeys.byCustomerInfinite("c-1", { pageSize: 20 }),
    ).toEqual([
      "transactions",
      "customer-infinite",
      "c-1",
      { pageSize: 20 },
    ]);
    expect(transactionKeys.detail("t-1")).toEqual([
      "transactions",
      "detail",
      "t-1",
    ]);
  });

  test("collection, statement, settings, and feature-flag keys are deterministic", () => {
    expect(collectionKeys.list("amount")).toEqual([
      "collection",
      "list",
      "amount",
    ]);
    expect(collectionKeys.list("age")).toEqual(["collection", "list", "age"]);
    expect(statementKeys.customer("c-1")).toEqual(["statements", "c-1", {}]);
    expect(
      statementKeys.customer("c-1", { start: "2026-01-01", end: "2026-01-31" }),
    ).toEqual([
      "statements",
      "c-1",
      { start: "2026-01-01", end: "2026-01-31" },
    ]);
    expect(settingsKeys.detail()).toEqual(["settings", "detail"]);
    expect(featureFlagKeys.all).toEqual(["feature-flags"]);
  });
});
