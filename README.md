# LedgerX

A minimal, fast, Android-only ledger app to record credit/debit for customers and send SMS reminders.

## Tech Stack

- **Frontend:** Expo (React Native) + TypeScript
- **Backend:** Supabase (Auth + PostgreSQL)
- **Navigation:** Expo Router
- **Package Manager:** Bun

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key:

```bash
cp .env.example .env
```

4. Update `.env` with your values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run on Android

```bash
bun android
```

This will start the Metro bundler and launch the Android emulator (or device if connected).

## Project Structure

```
app/
├── _layout.tsx          # Root layout with navigation
├── index.tsx            # Landing page
├── auth/                # Authentication screens
│   ├── login.tsx
│   └── signup.tsx
├── customers/           # Customer management
│   ├── index.tsx        # Customer list
│   ├── add.tsx          # Add customer
│   └── details.tsx      # Customer ledger
├── ledger/              # Ledger entries
│   └── add.tsx          # Add entry
├── components/          # Reusable components
├── hooks/               # Custom hooks
├── lib/                 # Utilities (Supabase client)
└── types/               # TypeScript types
```

## Features

- **Authentication:** Email/password sign up and login
- **Customer Management:** Add, view, and search customers
- **Ledger Tracking:** Record credit/debit transactions per customer
- **Balance Calculation:** Automatic running balance per customer
- **SMS Reminders:** Send balance updates via native SMS app
- **Offline Support:** Session persistence with AsyncStorage
- **Black & White UI:** Minimal, distraction-free design

## Database Schema

The app uses three tables with Row Level Security (RLS):

- `contacts` - Customer information (linked to user_id)
- `ledger_entries` - Transaction records (linked to contact_id)
- `get_contact_balance()` - SQL function for balance calculation

## Environment Variables

| Variable                        | Description               |
| ------------------------------- | ------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key    |

## Building for Production

```bash
eas build --platform android
```

## License

MIT
