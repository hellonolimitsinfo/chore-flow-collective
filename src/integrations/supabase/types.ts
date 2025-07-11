export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chore_completions: {
        Row: {
          chore_id: string
          completed_at: string
          completed_by: string
          id: string
          next_assignee_id: string
        }
        Insert: {
          chore_id: string
          completed_at?: string
          completed_by: string
          id?: string
          next_assignee_id: string
        }
        Update: {
          chore_id?: string
          completed_at?: string
          completed_by?: string
          id?: string
          next_assignee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chore_completions_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chore_completions_next_assignee_id_fkey"
            columns: ["next_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chores: {
        Row: {
          created_at: string
          created_by: string
          current_assignee_id: string
          frequency: string
          household_id: string
          id: string
          last_completed_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_assignee_id: string
          frequency: string
          household_id: string
          id?: string
          last_completed_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_assignee_id?: string
          frequency?: string
          household_id?: string
          id?: string
          last_completed_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_history: {
        Row: {
          amount: number
          bank_details: string
          created_at: string
          description: string
          household_id: string
          id: string
          original_expense_id: string
          owed_by: string[]
          paid_by: string
          settled_at: string
          split_type: string
        }
        Insert: {
          amount: number
          bank_details: string
          created_at: string
          description: string
          household_id: string
          id?: string
          original_expense_id: string
          owed_by?: string[]
          paid_by: string
          settled_at?: string
          split_type: string
        }
        Update: {
          amount?: number
          bank_details?: string
          created_at?: string
          description?: string
          household_id?: string
          id?: string
          original_expense_id?: string
          owed_by?: string[]
          paid_by?: string
          settled_at?: string
          split_type?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          bank_details: string
          created_at: string
          custom_amounts: Json | null
          description: string
          household_id: string
          id: string
          owed_by: string[]
          paid_by: string
          split_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_details: string
          created_at?: string
          custom_amounts?: Json | null
          description: string
          household_id: string
          id?: string
          owed_by?: string[]
          paid_by: string
          split_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_details?: string
          created_at?: string
          custom_amounts?: Json | null
          description?: string
          household_id?: string
          id?: string
          owed_by?: string[]
          paid_by?: string
          split_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invitations: {
        Row: {
          created_at: string
          email: string
          household_id: string
          id: string
          invited_by: string | null
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          household_id: string
          id?: string
          invited_by?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          household_id?: string
          id?: string
          invited_by?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          household_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          action: string
          created_at: string
          expense_description: string
          expense_id: string
          household_id: string
          id: string
          member_name: string
        }
        Insert: {
          action: string
          created_at?: string
          expense_description: string
          expense_id: string
          household_id: string
          id?: string
          member_name: string
        }
        Update: {
          action?: string
          created_at?: string
          expense_description?: string
          expense_id?: string
          household_id?: string
          id?: string
          member_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          household_id: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at?: string
          household_id: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          household_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          assigned_member_index: number | null
          category: string | null
          created_at: string
          household_id: string
          id: string
          is_purchased: boolean | null
          name: string
          purchased_by: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          assigned_member_index?: number | null
          category?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_purchased?: boolean | null
          name: string
          purchased_by?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          assigned_member_index?: number | null
          category?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_purchased?: boolean | null
          name?: string
          purchased_by?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_logs: {
        Row: {
          action: string
          created_at: string
          household_id: string
          id: string
          item_name: string
          member_name: string
        }
        Insert: {
          action: string
          created_at?: string
          household_id: string
          id?: string
          item_name: string
          member_name: string
        }
        Update: {
          action?: string
          created_at?: string
          household_id?: string
          id?: string
          item_name?: string
          member_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      household_member_details: {
        Row: {
          email: string | null
          full_name: string | null
          household_id: string | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_next_chore_assignee: {
        Args: { chore_household_id: string; current_assignee_id: string }
        Returns: string
      }
      is_household_member: {
        Args: { hid: string }
        Returns: boolean
      }
      is_member_of: {
        Args: { target_household: string }
        Returns: boolean
      }
      remove_household_member: {
        Args: { p_household_id: string; p_user_id_to_remove: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
