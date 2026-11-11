# Feature flags

Some shipped features can be switched off for a whole deployment by the
administrator who runs it, without shipping new client code and without a
redeploy. The values live in the database, the API is the only source of truth,
and a signed-in user can never change one.

## The registry

One row per flag in the `feature_flags` table:

| Column | Meaning |
| --- | --- |
| `key` | Stable identifier the clients key off |
| `enabled` | Whether the feature is available |
| `label` | Human-readable name |
| `description` | What the flag gates |

The API publishes the registry read-only:

```
GET /feature-flags
```

```json
{ "flags": { "collection": true, "upi_collection": false } }
```

The route needs no authentication: the registry holds no user data, and which
features a deployment offers never depends on who is asking. There is no route
that writes a flag — a request that tries is answered `404`.

## The flags that ship

| Key | Gates |
| --- | --- |
| `collection` | The receivables collection view: the Collection tab on web and mobile, the `/collection` screen, and `GET /collection` |
| `upi_collection` | The UPI configuration: the UPI ID and payee name in Settings and in Profile, and every UPI QR and payment link built from them |

Both ship **enabled**, so a deployment behaves exactly as it did before the
registry existed.

## What a disabled flag does

A disabled flag does not merely hide a button:

- the navigation entry is not rendered;
- the screen is not reachable — web redirects away, mobile hides the tab and
  redirects;
- the API route answers `404` (`GET /collection`) or withholds the values it
  guards (`GET /settings` omits `upiId` and `payeeName`, and `PUT /settings`
  answers `403` for a write to them).

## Changing a flag

Run the script from `apps/api`. It reads `DATABASE_URL` from the repository
root `.env`, so run it with that file in place.

```bash
cd apps/api
bun run db:feature-flag --key collection --enable false
bun run db:feature-flag --key collection --enable true
```

The script prints the new state:

```
"collection" (Collection view) is now disabled
```

### Adding a flag

A new flag is a new row — no client release is needed for it to be readable:

```bash
cd apps/api
bun run db:feature-flag --key statements \
  --label "Statements" \
  --description "Per-customer shareable statements."
```

The flag starts enabled. Gate it in the clients, then switch it off the way
above.

### Confirming the state

The registry is the truth; read it directly:

```bash
cd apps/api
bun run db:feature-flag --key collection --enable false
```

Clients re-read the registry within a minute and whenever the app comes to the
foreground, so a change is picked up without the user reloading.

## Failing open

If the registry cannot be read — the migration has not run yet, or the
database is briefly unavailable — every flag resolves to **enabled** and the
failure is logged on the server. A transient fault never hides a feature the
administrator never switched off.

## The money unit

Unrelated to the flags but worth repeating here: the ledger stores **whole
rupees** in an integer column, and both clients refuse a fractional amount
before a write is sent.
