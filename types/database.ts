export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ledger_entries: {
        Row: {
          id: string;
          contact_id: string;
          amount: number;
          type: "credit" | "debit";
          created_at: string;
          note: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          contact_id: string;
          amount: number;
          type: "credit" | "debit";
          created_at?: string;
          note?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          contact_id?: string;
          amount?: number;
          type?: "credit" | "debit";
          created_at?: string;
          note?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_entries_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_tags_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_tag_map: {
        Row: {
          id: string;
          contact_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          tag_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_tag_map_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_tag_map_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "contact_tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      get_contact_balance: {
        Args: { contact_id: string };
        Returns: {
          total_credit: number;
          total_debit: number;
          balance: number;
        }[];
      };
      get_filtered_transactions: {
        Args: {
          p_contact_id: string;
          p_start_date?: string;
          p_end_date?: string;
        };
        Returns: {
          id: string;
          amount: number;
          type: string;
          note: string | null;
          created_at: string;
          updated_at: string | null;
        }[];
      };
      get_contact_tags: {
        Args: { p_contact_id: string };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        }[];
      };
      get_tag_usage_count: {
        Args: { p_tag_id: string };
        Returns: number;
      };
    };
    Enums: {};
  };
}

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type LedgerEntry = Database["public"]["Tables"]["ledger_entries"]["Row"];
export type ContactTag = Database["public"]["Tables"]["contact_tags"]["Row"];
export type ContactTagMap =
  Database["public"]["Tables"]["contact_tag_map"]["Row"];

export interface ContactWithTags extends Contact {
  tags: ContactTag[];
}

export type TransactionType = "credit" | "debit";

export interface DateFilter {
  start: string | null;
  end: string | null;
  label?: string;
}

export const DATE_FILTER_PRESETS = [
  { label: "All Time", start: null, end: null },
  {
    label: "Today",
    start: new Date().toISOString(),
    end: new Date().toISOString(),
  },
  {
    label: "This Week",
    start: getStartOfWeek(),
    end: new Date().toISOString(),
  },
  {
    label: "This Month",
    start: getStartOfMonth(),
    end: new Date().toISOString(),
  },
  {
    label: "This Year",
    start: getStartOfYear(),
    end: new Date().toISOString(),
  },
] as const;

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function getStartOfYear(): string {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

export const TAG_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
] as const;

export interface DashboardMetrics {
  totalBalance: number;
  totalCustomers: number;
  thisMonthNet: number;
  pendingDue: number;
}

export interface RecentTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  note: string | null;
  created_at: string;
  contactName: string;
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};
