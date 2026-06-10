# Backend Plan: Express + Supabase Auth + Drizzle ORM

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── index.ts          # Drizzle + Supabase connection
│   │   ├── schema.ts         # Table definitions
│   │   └── migrations/       # Migration files
│   ├── middleware/
│   │   └── auth.ts           # JWT validation middleware
│   ├── routes/
│   │   ├── auth.ts           # Auth endpoints
│   │   ├── customers.ts      # Customer CRUD
│   │   ├── transactions.ts   # Transaction CRUD
│   │   ├── contact-tags.ts   # Contact tag management
│   │   ├── transaction-tags.ts# Transaction tag management
│   │   └── dashboard.ts      # Dashboard metrics
│   ├── utils/
│   │   └── supabase.ts       # Supabase admin client
│   ├── index.ts              # Express app entry
│   └── env.ts                # Environment variables
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Dependencies

### Runtime Dependencies
- `express@^5.0.0` - Web framework
- `cors@^2.8.5` - Cross-origin resource sharing
- `dotenv@^16.4.0` - Environment variable loading
- `@supabase/supabase-js@^2.89.0` - Supabase client
- `drizzle-orm@^0.36.0` - ORM
- `postgres@^3.4.0` - PostgreSQL driver
- `jsonwebtoken@^9.0.0` - JWT handling
- `zod@^3.23.0` - Schema validation

### Dev Dependencies
- `drizzle-kit@^0.30.0` - Migration tooling
- `@types/express@^5.0.0` - TypeScript types
- `@types/cors@^2.8.0` - TypeScript types
- `@types/jsonwebtoken@^9.0.0` - TypeScript types
- `tsx@^4.19.0` - TypeScript executor
- `typescript@^5.9.0` - TypeScript compiler

## All Routes

### Auth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout (client-side) |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Update password |
| GET | `/auth/me` | Get current user |

### Customer Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List all customers |
| GET | `/customers/:id` | Get customer with balance |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer (soft delete) |

### Transaction Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers/:id/transactions` | List transactions (with date filter) |
| GET | `/transactions/:id` | Get transaction details |
| POST | `/transactions` | Create transaction |
| PUT | `/transactions/:id` | Update transaction |
| DELETE | `/transactions/:id` | Delete transaction (soft delete) |

### Contact Tag Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List all contact tags |
| POST | `/tags` | Create contact tag |
| PUT | `/tags/:id` | Update contact tag |
| DELETE | `/tags/:id` | Delete contact tag |
| GET | `/customers/:id/tags` | Get tags for customer |
| POST | `/customers/:id/tags` | Add tag to customer |
| DELETE | `/customers/:id/tags/:tagId` | Remove tag from customer |

### Transaction Tag Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transaction-tags` | List all transaction tags |
| POST | `/transaction-tags` | Create transaction tag |
| PUT | `/transaction-tags/:id` | Update transaction tag |
| DELETE | `/transaction-tags/:id` | Delete transaction tag |
| GET | `/transactions/:id/tags` | Get tags for transaction |
| POST | `/transactions/:id/tags` | Add tag to transaction |
| DELETE | `/transactions/:id/tags/:tagId` | Remove tag from transaction |

### Dashboard Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/metrics` | Get total balance, customers, monthly net, pending due |
| GET | `/dashboard/recent-transactions` | Get recent transactions |

## Auth Flow

1. **Signup/Login** → Express calls Supabase Auth API → Returns JWT token
2. **Subsequent requests** → Express validates JWT via `supabase-admin.auth.verifyJwt()` → Extracts `user_id` → Uses in queries
3. All queries filter by `user_id` for security

## Environment Variables

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
PORT=3000
```

## Database Schema (from Supabase)

The backend will use the existing Supabase schema:

- `contacts` - Customer/contact table
- `ledger_entries` - Transaction records
- `contact_tags` - Tags for customers
- `contact_tag_map` - Customer-tag mapping
- `transaction_tags` - Tags for transactions
- `transaction_tag_map` - Transaction-tag mapping

All tables have RLS policies already configured in Supabase.

## Drizzle Configuration

Drizzle will connect to Supabase PostgreSQL and generate types from the existing schema. Use `drizzle-kit` for:
- `drizzle-kit push` - Push schema changes to database
- `drizzle-kit generate` - Generate type definitions
- `drizzle-kit studio` - Visual database editor

## Error Response Format

All errors follow consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

Successful responses:

```json
{
  "data": { ... }
}
```