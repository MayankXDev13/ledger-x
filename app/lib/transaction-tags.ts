import { supabase } from "./supabase";
import { TransactionTag } from "@/types/database";

export const getUserTransactionTags = async (
  userId: string,
): Promise<TransactionTag[]> => {
  const { data, error } = await supabase
    .from("transaction_tags")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return data || [];
};

export const createTransactionTag = async (
  userId: string,
  name: string,
  color: string,
): Promise<TransactionTag> => {
  const { data, error } = await supabase
    .from("transaction_tags")
    .insert({ user_id: userId, name, color })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTransactionTag = async (
  tagId: string,
  name: string,
  color: string,
): Promise<void> => {
  const { error } = await supabase
    .from("transaction_tags")
    .update({ name, color })
    .eq("id", tagId);

  if (error) throw error;
};

export const deleteTransactionTag = async (tagId: string): Promise<void> => {
  const { error } = await supabase
    .from("transaction_tags")
    .delete()
    .eq("id", tagId);

  if (error) throw error;
};

export const getTransactionTags = async (
  transactionId: string,
): Promise<TransactionTag[]> => {
  const { data, error } = await supabase.rpc("get_transaction_tags", {
    p_transaction_id: transactionId,
  });

  if (error) throw error;
  return data || [];
};

export const replaceTransactionTags = async (
  transactionId: string,
  tagIds: string[],
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from("transaction_tag_map")
    .delete()
    .eq("transaction_id", transactionId);

  if (deleteError) throw deleteError;

  if (tagIds.length > 0) {
    const inserts = tagIds.map((tagId) => ({
      transaction_id: transactionId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from("transaction_tag_map")
      .insert(inserts);

    if (insertError) throw insertError;
  }
};

export const getTransactionTagUsageCount = async (
  tagId: string,
): Promise<number> => {
  const { data, error } = await supabase.rpc(
    "get_transaction_tag_usage_count",
    {
      p_tag_id: tagId,
    },
  );

  if (error) throw error;
  return data || 0;
};
