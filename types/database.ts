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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      ledger_entries: {
        Row: {
          id: string;
          contact_id: string;
          amount: number;
          type: 'credit' | 'debit';
          created_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          contact_id: string;
          amount: number;
          type: 'credit' | 'debit';
          created_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          contact_id?: string;
          amount?: number;
          type?: 'credit' | 'debit';
          created_at?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ledger_entries_contact_id_fkey';
            columns: ['contact_id'];
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      get_contact_balance: {
        Args: { contact_id: string };
        Returns: { total_credit: number; total_debit: number; balance: number }[];
      };
    };
    Enums: {};
  };
}

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row'];
