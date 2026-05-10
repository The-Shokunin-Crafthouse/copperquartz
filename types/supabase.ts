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
      contributions: {
        Row: {
          amount_cents: number
          created_at: string | null
          email: string
          fund: string
          gift_cents: number | null
          id: string
          lenders_choice: boolean | null
          message: string | null
          name: string
          reference_url: string | null
          self_reported: boolean | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          email: string
          fund: string
          gift_cents?: number | null
          id?: string
          lenders_choice?: boolean | null
          message?: string | null
          name: string
          reference_url?: string | null
          self_reported?: boolean | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          email?: string
          fund?: string
          gift_cents?: number | null
          id?: string
          lenders_choice?: boolean | null
          message?: string | null
          name?: string
          reference_url?: string | null
          self_reported?: boolean | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      digest_runs: {
        Row: {
          accommodations_included: number
          id: string
          responses_included: number
          sent_at: string
        }
        Insert: {
          accommodations_included: number
          id?: string
          responses_included: number
          sent_at?: string
        }
        Update: {
          accommodations_included?: number
          id?: string
          responses_included?: number
          sent_at?: string
        }
        Relationships: []
      }
      guest_parties: {
        Row: {
          canonical_hash: string
          created_at: string | null
          id: string
          party_name: string
        }
        Insert: {
          canonical_hash: string
          created_at?: string | null
          id?: string
          party_name: string
        }
        Update: {
          canonical_hash?: string
          created_at?: string | null
          id?: string
          party_name?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string | null
          first_name: string
          full_name: string
          id: string
          last_name: string
          lookup_aliases: string[] | null
          party_id: string
        }
        Insert: {
          created_at?: string | null
          first_name: string
          full_name: string
          id?: string
          last_name: string
          lookup_aliases?: string[] | null
          party_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          full_name?: string
          id?: string
          last_name?: string
          lookup_aliases?: string[] | null
          party_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "guest_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_accommodations: {
        Row: {
          id: string
          last_edited_by_guest_id: string | null
          notes: string | null
          party_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_edited_by_guest_id?: string | null
          notes?: string | null
          party_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_edited_by_guest_id?: string | null
          notes?: string | null
          party_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_accommodations_last_edited_by_guest_id_fkey"
            columns: ["last_edited_by_guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_accommodations_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: true
            referencedRelation: "guest_parties"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_responses: {
        Row: {
          attending: boolean
          beverage_category: string | null
          beverage_selection: string | null
          guest_id: string
          id: string
          monday_meetup: boolean | null
          needs_transport: boolean | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          attending: boolean
          beverage_category?: string | null
          beverage_selection?: string | null
          guest_id: string
          id?: string
          monday_meetup?: boolean | null
          needs_transport?: boolean | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          attending?: boolean
          beverage_category?: string | null
          beverage_selection?: string | null
          guest_id?: string
          id?: string
          monday_meetup?: boolean | null
          needs_transport?: boolean | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
