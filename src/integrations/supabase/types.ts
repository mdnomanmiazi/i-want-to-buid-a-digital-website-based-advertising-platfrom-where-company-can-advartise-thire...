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
      ad_payments: {
        Row: {
          ad_id: string | null
          amount: number
          created_at: string
          currency: string
          gateway_response: Json | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["ad_plan"]
          refund_status: Database["public"]["Enums"]["refund_status"]
          status: string
          tran_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          amount: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan: Database["public"]["Enums"]["ad_plan"]
          refund_status?: Database["public"]["Enums"]["refund_status"]
          status?: string
          tran_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          gateway_response?: Json | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          plan?: Database["public"]["Enums"]["ad_plan"]
          refund_status?: Database["public"]["Enums"]["refund_status"]
          status?: string
          tran_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_payments_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action_type: string
          ad_id: string | null
          admin_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          payment_id: string | null
          refund_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          ad_id?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          refund_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          ad_id?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          refund_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "ad_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          category: string
          contact_phone: string | null
          created_at: string
          description: string
          discount_percent: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          link_url: string | null
          location: string | null
          offer_price: number
          original_price: number | null
          plan: Database["public"]["Enums"]["ad_plan"]
          rejection_reason: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["ad_status"]
          title: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          contact_phone?: string | null
          created_at?: string
          description: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          location?: string | null
          offer_price: number
          original_price?: number | null
          plan: Database["public"]["Enums"]["ad_plan"]
          rejection_reason?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          location?: string | null
          offer_price?: number
          original_price?: number | null
          plan?: Database["public"]["Enums"]["ad_plan"]
          rejection_reason?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          title?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          ad_id: string | null
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          initiated_by: string | null
          payment_id: string
          reason: string | null
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          initiated_by?: string | null
          payment_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          initiated_by?: string | null
          payment_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "ad_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_plan: "single" | "monthly" | "yearly"
      ad_status:
        | "draft"
        | "payment_pending"
        | "waiting_for_admin_approval"
        | "approved"
        | "rejected"
        | "refunded"
        | "expired"
      app_role: "admin" | "user"
      payment_status: "pending" | "paid" | "failed" | "cancelled"
      refund_status: "none" | "pending" | "completed" | "failed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_plan: ["single", "monthly", "yearly"],
      ad_status: [
        "draft",
        "payment_pending",
        "waiting_for_admin_approval",
        "approved",
        "rejected",
        "refunded",
        "expired",
      ],
      app_role: ["admin", "user"],
      payment_status: ["pending", "paid", "failed", "cancelled"],
      refund_status: ["none", "pending", "completed", "failed"],
    },
  },
} as const
