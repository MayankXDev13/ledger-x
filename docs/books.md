# Books: single-book behavior

Every user has exactly one book. The API resolves `book_id` server-side on
every write, so clients never send a book reference and cannot spoof one. The
schema is multi-book ready (`books` table, `book_id` on customers and
transactions, one default book per user via a partial unique index), but there
is no book-management UI in this release.

## `GET /books`

Returns the caller's default book, lazily creating it on first call. Repeated
calls create no duplicates (the insert is an idempotent `ON CONFLICT` path and
the partial unique index `(user_id) WHERE is_default` is the hard guarantee).

Request:

```
GET /books
Authorization: Bearer <session-token>
```

Response `200`:

```json
{
  "id": "7f0d1c2e-1f2b-4c3d-8a9e-000000000001",
  "userId": "user-1",
  "name": "My Book",
  "isDefault": true
}
```

An unauthenticated request returns the standard `401` JSON error envelope:

```json
{ "error": "Unauthorized" }
```

## Server-side resolution

- `POST /customers` and `POST /transactions` ignore any client-supplied
  `bookId`; the handler inserts the caller's default book id.
- A transaction's `book_id` is derived from its customer, so the two can never
  disagree.
- Customer and transaction responses include `bookId` for read-side joins.
- Cross-user references behave like every other resource: a write that names
  another user's customer returns `404` and changes nothing (covered by
  `apps/api/src/test/books.test.ts`).

## Migration behavior

The `0006_parallel_nomad` migration is expand → backfill → contract: it creates
`books` and `user_settings`, adds nullable `book_id`/`payment_method`/
`is_sample` columns, inserts one default book per existing user, backfills
`book_id`, then enforces `NOT NULL`. After the backfill,
`SELECT count(*) FROM customers WHERE book_id IS NULL` (and the equivalent
transactions query) returns `0`.
