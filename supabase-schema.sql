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
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, phone)
);

## Create ledger_entries table
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

## Create contact_tags table for user-defined categories
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

## Create contact_tag_map junction table
CREATE TABLE contact_tag_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES contact_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(contact_id, tag_id)
);

## Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_map ENABLE ROW LEVEL SECURITY;

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

## Policies for contact_tags
CREATE POLICY "Users can view their own tags"
  ON contact_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON contact_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON contact_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON contact_tags FOR DELETE
  USING (auth.uid() = user_id);

## Policies for contact_tag_map
CREATE POLICY "Users can view tag mappings for their contacts"
  ON contact_tag_map FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_map.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tag mappings for their contacts"
  ON contact_tag_map FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_map.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tag mappings for their contacts"
  ON contact_tag_map FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_map.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

## Create function to get contact balance
CREATE OR REPLACE FUNCTION get_contact_balance(contact_id UUID)
RETURNS TABLE (total_credit DECIMAL, total_debit DECIMAL, balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN le.type = 'credit' THEN le.amount ELSE 0 END), 0) as total_credit,
    COALESCE(SUM(CASE WHEN le.type = 'debit' THEN le.amount ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN le.type = 'credit' THEN le.amount ELSE -le.amount END), 0) as balance
  FROM ledger_entries le
  INNER JOIN contacts c ON le.contact_id = c.id
  WHERE le.contact_id = get_contact_balance.contact_id
    AND c.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

## Create function to soft delete customer (cascade delete transactions)
CREATE OR REPLACE FUNCTION soft_delete_customer(p_contact_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM ledger_entries WHERE contact_id = p_contact_id;
  UPDATE contacts SET deleted_at = NOW() WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create function to get filtered transactions by date range
CREATE OR REPLACE FUNCTION get_filtered_transactions(
  p_contact_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  amount DECIMAL(12,2),
  type TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT le.id, le.amount, le.type, le.note, le.created_at, le.updated_at
  FROM ledger_entries le
  INNER JOIN contacts c ON le.contact_id = c.id
  WHERE le.contact_id = p_contact_id
    AND c.deleted_at IS NULL
    AND (p_start_date IS NULL OR le.created_at >= p_start_date)
    AND (p_end_date IS NULL OR le.created_at <= p_end_date)
  ORDER BY le.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create function to update ledger entry
CREATE OR REPLACE FUNCTION update_ledger_entry(
  p_entry_id UUID,
  p_amount DECIMAL(12,2),
  p_type TEXT,
  p_note TEXT,
  p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
  UPDATE ledger_entries
  SET 
    amount = p_amount,
    type = p_type,
    note = p_note,
    created_at = p_created_at,
    updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create function to get all tags for a contact
CREATE OR REPLACE FUNCTION get_contact_tags(p_contact_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT ct.id, ct.user_id, ct.name, ct.color, ct.created_at
  FROM contact_tags ct
  INNER JOIN contact_tag_map ctm ON ct.id = ctm.tag_id
  WHERE ctm.contact_id = p_contact_id
    AND ct.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  ORDER BY ct.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create function to get tag usage count
CREATE OR REPLACE FUNCTION get_tag_usage_count(p_tag_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM contact_tag_map WHERE tag_id = p_tag_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create index for faster queries
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_ledger_entries_contact_id ON ledger_entries(contact_id);
CREATE INDEX idx_ledger_entries_created_at ON ledger_entries(created_at DESC);
CREATE INDEX idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX idx_contact_tag_map_contact_id ON contact_tag_map(contact_id);
CREATE INDEX idx_contact_tag_map_tag_id ON contact_tag_map(tag_id);

## Create function to get total balance across all contacts for a user
CREATE OR REPLACE FUNCTION get_total_balance(p_user_id UUID)
RETURNS TABLE (balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(
      CASE WHEN le.type = 'credit' THEN le.amount ELSE -le.amount END
    ), 0)::DECIMAL(12,2) as balance
  FROM ledger_entries le
  INNER JOIN contacts c ON le.contact_id = c.id
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## Create function to get pending due (total amount customers owe)
CREATE OR REPLACE FUNCTION get_pending_due(p_user_id UUID)
RETURNS TABLE (pending_due DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(
      CASE WHEN le.type = 'debit' THEN le.amount ELSE -le.amount END
    ), 0)::DECIMAL(12,2) as pending_due
  FROM ledger_entries le
  INNER JOIN contacts c ON le.contact_id = c.id
  WHERE c.user_id = p_user_id
    AND c.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
