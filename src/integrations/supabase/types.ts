export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          initial_balance: number
          is_primary: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_primary?: boolean
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_balance?: number
          is_primary?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          attempt_count: number
          error_code: string | null
          event_type: string
          external_event_id: string | null
          external_payment_id: string | null
          external_subscription_id: string | null
          id: string
          payload: Json
          payload_hash: string
          processed_at: string | null
          processing_status: string
          provider: string
          provider_created_at: string | null
          received_at: string
        }
        Insert: {
          attempt_count?: number
          error_code?: string | null
          event_type: string
          external_event_id?: string | null
          external_payment_id?: string | null
          external_subscription_id?: string | null
          id?: string
          payload: Json
          payload_hash: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_created_at?: string | null
          received_at?: string
        }
        Update: {
          attempt_count?: number
          error_code?: string | null
          event_type?: string
          external_event_id?: string | null
          external_payment_id?: string | null
          external_subscription_id?: string | null
          id?: string
          payload?: Json
          payload_hash?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_created_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          description: string
          end_date: string | null
          exception_dates: string[]
          frequency: string
          id: string
          occurrences_limit: number | null
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          exception_dates?: string[]
          frequency: string
          id?: string
          occurrences_limit?: number | null
          start_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          exception_dates?: string[]
          frequency?: string
          id?: string
          occurrences_limit?: number | null
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_account_owner_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          access_until: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          external_customer_id: string | null
          external_subscription_id: string | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          last_event_at: string | null
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          plan: string
          price_id: string | null
          product_id: string | null
          provider: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_until?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          last_event_at?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          price_id?: string | null
          product_id?: string | null
          provider?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_until?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          last_event_at?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          price_id?: string | null
          product_id?: string | null
          provider?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          recurrence_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          recurrence_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          recurrence_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_owner_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrence_owner_fkey"
            columns: ["recurrence_id", "user_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_paid_access: { Args: never; Returns: boolean }
      process_paddle_subscription_event: {
        Args: {
          _cancel_at_period_end: boolean
          _current_period_end: string
          _current_period_start: string
          _environment: string
          _event_type: string
          _external_customer_id: string
          _external_event_id: string
          _external_subscription_id: string
          _payload: Json
          _payload_hash: string
          _plan: string
          _price_id: string
          _product_id: string
          _provider_created_at: string
          _status: string
          _user_id: string
        }
        Returns: string
      }
      register_billing_webhook_event: {
        Args: {
          _event_type: string
          _external_event_id: string
          _external_payment_id: string
          _external_subscription_id: string
          _payload: Json
          _payload_hash: string
          _provider_created_at: string
        }
        Returns: {
          attempts: number
          event_id: string
          is_new: boolean
        }[]
      }
      register_ignored_billing_webhook_event: {
        Args: {
          _error_code: string
          _event_type: string
          _external_payment_id: string
          _payload: Json
          _payload_hash: string
          _provider_created_at: string
        }
        Returns: {
          attempts: number
          event_id: string
          is_new: boolean
        }[]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
