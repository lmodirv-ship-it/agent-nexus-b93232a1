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
      activity_log: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          target: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          target?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          target?: string | null
        }
        Relationships: []
      }
      agent_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_cycle: number | null
          goal: string
          id: string
          result_summary: string | null
          scale: string | null
          status: string | null
          total_cycles: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_cycle?: number | null
          goal: string
          id?: string
          result_summary?: string | null
          scale?: string | null
          status?: string | null
          total_cycles?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_cycle?: number | null
          goal?: string
          id?: string
          result_summary?: string | null
          scale?: string | null
          status?: string | null
          total_cycles?: number | null
        }
        Relationships: []
      }
      agent_site_links: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string | null
          id: string
          last_sync_at: string | null
          note: string | null
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          note?: string | null
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_sync_at?: string | null
          note?: string | null
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_site_links_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_site_links_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          cycle: number | null
          id: string
          input: string | null
          level: string
          output: string | null
          parent_id: string | null
          role: string
          session_id: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
          input?: string | null
          level: string
          output?: string | null
          parent_id?: string | null
          role: string
          session_id?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          cycle?: number | null
          id?: string
          input?: string | null
          level?: string
          output?: string | null
          parent_id?: string | null
          role?: string
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_catalog: {
        Row: {
          description: string | null
          emoji: string | null
          frequency: string | null
          id: string
          is_active: boolean
          name_ar: string
          role: string
          slug: string
        }
        Insert: {
          description?: string | null
          emoji?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          role: string
          slug: string
        }
        Update: {
          description?: string | null
          emoji?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          role?: string
          slug?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          hashed_secret: string
          id: string
          label: string
          last_used_at: string | null
          prefix: string
          scopes: string[] | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          hashed_secret: string
          id?: string
          label: string
          last_used_at?: string | null
          prefix: string
          scopes?: string[] | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          hashed_secret?: string
          id?: string
          label?: string
          last_used_at?: string | null
          prefix?: string
          scopes?: string[] | null
        }
        Relationships: []
      }
      attack_attempts: {
        Row: {
          blocked: boolean | null
          country: string | null
          created_at: string
          id: string
          ip: string
          kind: string | null
          target: string | null
        }
        Insert: {
          blocked?: boolean | null
          country?: string | null
          created_at?: string
          id?: string
          ip: string
          kind?: string | null
          target?: string | null
        }
        Update: {
          blocked?: boolean | null
          country?: string | null
          created_at?: string
          id?: string
          ip?: string
          kind?: string | null
          target?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip: string | null
          target: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          target?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string | null
          id: string
          site_id: string | null
          size_gb: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          site_id?: string | null
          size_gb?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          site_id?: string | null
          size_gb?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      databases_registry: {
        Row: {
          created_at: string | null
          engine: string | null
          id: string
          name: string
          site_id: string | null
          size_gb: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          engine?: string | null
          id?: string
          name: string
          site_id?: string | null
          size_gb?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          engine?: string | null
          id?: string
          name?: string
          site_id?: string | null
          size_gb?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "databases_registry_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_events: {
        Row: {
          agent_id: string | null
          attempts: number
          created_at: string
          delivered_at: string | null
          direction: string
          error: string | null
          id: string
          payload: Json
          site_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          direction: string
          error?: string | null
          id?: string
          payload?: Json
          site_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error?: string | null
          id?: string
          payload?: Json
          site_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          from_addr: string
          id: string
          read_at: string | null
          site_id: string | null
          subject: string | null
          to_addr: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          from_addr: string
          id?: string
          read_at?: string | null
          site_id?: string | null
          subject?: string | null
          to_addr: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          from_addr?: string
          id?: string
          read_at?: string | null
          site_id?: string | null
          subject?: string | null
          to_addr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          id: string
          kind: string
          message: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kind: string
          message?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kind?: string
          message?: string | null
          severity?: string | null
        }
        Relationships: []
      }
      service_call_logs: {
        Row: {
          created_at: string
          endpoint: string | null
          id: string
          provider_service_id: string | null
          response_code: number | null
          response_time_ms: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          id?: string
          provider_service_id?: string | null
          response_code?: number | null
          response_time_ms?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          id?: string
          provider_service_id?: string | null
          response_code?: number | null
          response_time_ms?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_call_logs_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_dependencies: {
        Row: {
          consumer_site_id: string | null
          created_at: string
          id: string
          provider_service_id: string | null
        }
        Insert: {
          consumer_site_id?: string | null
          created_at?: string
          id?: string
          provider_service_id?: string | null
        }
        Update: {
          consumer_site_id?: string | null
          created_at?: string
          id?: string
          provider_service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_dependencies_consumer_site_id_fkey"
            columns: ["consumer_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_dependencies_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          calls_today: number | null
          created_at: string
          endpoint_url: string | null
          health: string
          id: string
          is_public: boolean | null
          name: string
          rate_limit: number | null
          site_id: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          calls_today?: number | null
          created_at?: string
          endpoint_url?: string | null
          health?: string
          id?: string
          is_public?: boolean | null
          name: string
          rate_limit?: number | null
          site_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          calls_today?: number | null
          created_at?: string
          endpoint_url?: string | null
          health?: string
          id?: string
          is_public?: boolean | null
          name?: string
          rate_limit?: number | null
          site_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          api_key_hash: string | null
          client_id: string | null
          created_at: string | null
          db_size_gb: number | null
          domain: string
          email: string | null
          health: string
          icon_color: string | null
          id: string
          last_heartbeat_at: string | null
          status: string
          storage_gb: number | null
          updated_at: string
          users_count: number | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_hash?: string | null
          client_id?: string | null
          created_at?: string | null
          db_size_gb?: number | null
          domain: string
          email?: string | null
          health?: string
          icon_color?: string | null
          id?: string
          last_heartbeat_at?: string | null
          status?: string
          storage_gb?: number | null
          updated_at?: string
          users_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string | null
          client_id?: string | null
          created_at?: string | null
          db_size_gb?: number | null
          domain?: string
          email?: string | null
          health?: string
          icon_color?: string | null
          id?: string
          last_heartbeat_at?: string | null
          status?: string
          storage_gb?: number | null
          updated_at?: string
          users_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_folders: {
        Row: {
          created_at: string | null
          file_count: number | null
          icon: string | null
          id: string
          name: string
          size_gb: number | null
        }
        Insert: {
          created_at?: string | null
          file_count?: number | null
          icon?: string | null
          id?: string
          name: string
          size_gb?: number | null
        }
        Update: {
          created_at?: string | null
          file_count?: number | null
          icon?: string | null
          id?: string
          name?: string
          size_gb?: number | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Enums: {
      app_role: "owner" | "admin" | "agent" | "viewer"
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
      app_role: ["owner", "admin", "agent", "viewer"],
    },
  },
} as const
