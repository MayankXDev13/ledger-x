import type { Hono } from "hono";
import type { Db, WithDb } from "../db";
import type {
  AppDependencies,
  AppEnv,
  AuthUser,
  Bindings,
  VerifyToken,
} from "../types/hono";
import { createApp } from "../app";

export type Row = Record<string, unknown>;
type Result = Row[] | Error;

export class FakeDb {
  private selectResults: Result[] = [];
  private insertResults: Result[] = [];
  private updateResults: Result[] = [];
  private deleteResults: Result[] = [];

  insertCalls = 0;
  updateCalls = 0;
  deleteCalls = 0;

  queueSelect(...rows: Row[]) {
    this.selectResults.push(rows);
  }

  queueSelectError(error: Error) {
    this.selectResults.push(error);
  }

  queueInsert(...rows: Row[]) {
    this.insertResults.push(rows);
  }

  queueInsertError(error: Error) {
    this.insertResults.push(error);
  }

  queueUpdate(...rows: Row[]) {
    this.updateResults.push(rows);
  }

  queueUpdateError(error: Error) {
    this.updateResults.push(error);
  }

  queueDelete(...rows: Row[]) {
    this.deleteResults.push(rows);
  }

  queueDeleteError(error: Error) {
    this.deleteResults.push(error);
  }

  nextSelect(): Row[] {
    const next = this.selectResults.shift();
    if (next instanceof Error) throw next;
    return next ?? [];
  }

  nextInsert(): Row[] {
    const next = this.insertResults.shift();
    if (next instanceof Error) throw next;
    return next ?? [];
  }

  nextUpdate(): Row[] {
    const next = this.updateResults.shift();
    if (next instanceof Error) throw next;
    return next ?? [];
  }

  nextDelete(): Row[] {
    const next = this.deleteResults.shift();
    if (next instanceof Error) throw next;
    return next ?? [];
  }

  select() {
    return new SelectChain(this);
  }

  insert() {
    this.insertCalls += 1;
    return new InsertChain(this);
  }

  update() {
    this.updateCalls += 1;
    return new UpdateChain(this);
  }

  delete() {
    this.deleteCalls += 1;
    return new DeleteChain(this);
  }
}

class SelectChain implements PromiseLike<Row[]> {
  constructor(private readonly db: FakeDb) {}

  from() {
    return this;
  }

  where() {
    return this;
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  offset() {
    return this;
  }

  innerJoin() {
    return this;
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.db.nextSelect()).then(onfulfilled, onrejected);
  }
}

class InsertChain implements PromiseLike<Row[]> {
  constructor(private readonly db: FakeDb) {}

  values() {
    return this;
  }

  onConflictDoUpdate() {
    return this;
  }

  onConflictDoNothing() {
    return this;
  }

  returning() {
    return Promise.resolve(this.db.nextInsert());
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.db.nextInsert()).then(onfulfilled, onrejected);
  }
}

class UpdateChain implements PromiseLike<Row[]> {
  constructor(private readonly db: FakeDb) {}

  set() {
    return this;
  }

  where() {
    return this;
  }

  returning() {
    return Promise.resolve(this.db.nextUpdate());
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.db.nextUpdate()).then(onfulfilled, onrejected);
  }
}

class DeleteChain implements PromiseLike<Row[]> {
  constructor(private readonly db: FakeDb) {}

  where() {
    return this;
  }

  returning() {
    return Promise.resolve(this.db.nextDelete());
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((value: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.db.nextDelete()).then(onfulfilled, onrejected);
  }
}

export const testUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  image: "https://example.com/avatar.png",
} as AuthUser;

export function fakeVerifyToken(
  user: AuthUser | null = testUser,
  validToken = "valid-token",
): VerifyToken {
  return async (_ctx, token) => (token === validToken ? user : null);
}

export function fakeWithDb(db: FakeDb): WithDb {
  return async (_ctx, fn) => fn(db as unknown as Db);
}

export function useFakeDb(db: FakeDb): AppDependencies {
  return {
    verifyToken: fakeVerifyToken(),
    withDb: fakeWithDb(db),
  };
}

export function makeTestApp(overrides: Partial<AppDependencies> = {}) {
  return createApp({
    verifyToken: fakeVerifyToken(),
    withDb: fakeWithDb(new FakeDb()),
    ...overrides,
  });
}

export function requestApp(
  app: Hono<AppEnv>,
  path: string,
  init: RequestInit = {},
  env: Partial<Bindings> = {},
) {
  return app.request(path, init, {
    HYPERDRIVE: {} as Hyperdrive,
    TRUSTED_ORIGINS: "http://localhost:3000",
    ...env,
  } as Bindings);
}

export function authHeaders(token = "valid-token") {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Queues the feature-flag registry read that every gated route performs
 * before it serves its own data.
 */
export function queueFlags(
  db: FakeDb,
  enabled: boolean | Record<string, boolean> = true,
) {
  const value = (key: string) =>
    typeof enabled === "boolean" ? enabled : (enabled[key] ?? true);
  db.queueSelect(
    { key: "collection", enabled: value("collection") },
    { key: "upi_collection", enabled: value("upi_collection") },
    { key: "sample_data", enabled: value("sample_data") },
    { key: "account_deletion", enabled: value("account_deletion") },
  );
}
