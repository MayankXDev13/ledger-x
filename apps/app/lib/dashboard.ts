import { supabase } from "./supabase";
import { DashboardMetrics, RecentTransaction } from "@/types/database";

export const getDashboardMetrics = async (
  userId: string,
): Promise<DashboardMetrics> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count: totalCustomers } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("user_id", userId);

  const { data: balanceData } = await supabase.rpc("get_total_balance", {
    p_user_id: userId,
  });

  const { data: pendingData } = await supabase.rpc("get_pending_due", {
    p_user_id: userId,
  });

  const { data: monthlyEntries } = await supabase
    .from("ledger_entries")
    .select("amount, type")
    .gte("created_at", startOfMonth.toISOString())
    .in(
      "contact_id",
      (
        await supabase.from("contacts").select("id").eq("user_id", userId)
      ).data?.map((c) => c.id) || [],
    );

  const totalCredits =
    monthlyEntries
      ?.filter((e) => e.type === "credit")
      .reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalDebits =
    monthlyEntries
      ?.filter((e) => e.type === "debit")
      .reduce((sum, e) => sum + e.amount, 0) || 0;

  return {
    totalBalance: balanceData?.[0]?.balance || 0,
    totalCustomers: totalCustomers || 0,
    thisMonthNet: totalCredits - totalDebits,
    pendingDue: pendingData?.[0]?.pending_due ?? 0,
  };
};

export const getRecentTransactions = async (
  userId: string,
  limit: number = 5,
): Promise<RecentTransaction[]> => {
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (!contacts || contacts.length === 0) return [];

  const contactIds = contacts.map((c) => c.id);

  const { data, error } = await supabase
    .from("ledger_entries")
    .select(
      `
      id,
      amount,
      type,
      note,
      created_at,
      contacts (name)
    `,
    )
    .in("contact_id", contactIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (
    data?.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      type: entry.type as "credit" | "debit",
      note: entry.note,
      created_at: entry.created_at,
      contactName: (entry.contacts as unknown as { name: string }).name,
    })) || []
  );
};
