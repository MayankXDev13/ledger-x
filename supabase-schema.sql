# Supabase Database Schema for LedgerX

## Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

## Create contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, phone)
);

## Create ledger_entries table
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  note TEXT
);

## Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

## Create policies for contacts
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

## Create policies for ledger_entries
CREATE POLICY "Users can view entries for their contacts"
  ON ledger_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = ledger_entries.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert entries for their contacts"
  ON ledger_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = ledger_entries.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update entries for their contacts"
  ON ledger_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = ledger_entries.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete entries for their contacts"
  ON ledger_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = ledger_entries.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

## Create function to get contact balance
CREATE OR REPLACE FUNCTION get_contact_balance(contact_id UUID)
RETURNS TABLE (total_credit DECIMAL, total_debit DECIMAL, balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credit,
    COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance
  FROM ledger_entries
  WHERE contact_id = get_contact_balance.contact_id;
END;
$$ LANGUAGE plpgsql;

## Create index for faster queries
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_ledger_entries_contact_id ON ledger_entries(contact_id);
CREATE INDEX idx_ledger_entries_created_at ON ledger_entries(created_at DESC);
