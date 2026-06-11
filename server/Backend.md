
## All Routes

### Auth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
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

