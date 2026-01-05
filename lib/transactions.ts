import { supabase } from "./supabase";
import { TransactionType } from "@/types/database";

export const updateTransaction = async (
  entryId: string,
  amount: number,
  type: TransactionType,
  note: string,
  createdAt: string,
): Promise<void> => {
  const { error } = await supabase.rpc("update_ledger_entry", {
    p_entry_id: entryId,
    p_amount: amount,
    p_type: type,
    p_note: note || null,
    p_created_at: createdAt,
  });

  if (error) throw error;
};

export const deleteTransaction = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
};

export const deleteCustomerWithTransactions = async (
  contactId: string,
): Promise<void> => {
  const { error } = await supabase.rpc("soft_delete_customer", {
    p_contact_id: contactId,
  });

  if (error) throw error;
};

export const getFilteredTransactions = async (
  contactId: string,
  startDate: string | null,
  endDate: string | null,
) => {
  const { data, error } = await supabase.rpc("get_filtered_transactions", {
    p_contact_id: contactId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return data || [];
};
