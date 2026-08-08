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
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          metadata: Json
          target_client_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json
          target_client_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json
          target_client_id?: string | null
          target_user_id?: string | null
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
      ai_models: {
        Row: {
          capabilities: string[]
          caps: Json
          category: string
          context_window: number | null
          created_at: string
          description: string | null
          display_name: string | null
          gateway_code: string | null
          id: string
          input_price_per_million: number | null
          is_default: boolean
          is_enabled: boolean
          max_output_tokens: number | null
          metadata: Json
          modalities: Json
          model_code: string
          model_id: string
          name: string | null
          notes: string | null
          output_price_per_million: number | null
          priority: number
          provider: string | null
          provider_id: string | null
          role: string | null
          rules: string | null
          source: string | null
          status: string
          task: string | null
          updated_at: string
        }
        Insert: {
          capabilities?: string[]
          caps?: Json
          category?: string
          context_window?: number | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          gateway_code?: string | null
          id?: string
          input_price_per_million?: number | null
          is_default?: boolean
          is_enabled?: boolean
          max_output_tokens?: number | null
          metadata?: Json
          modalities?: Json
          model_code: string
          model_id: string
          name?: string | null
          notes?: string | null
          output_price_per_million?: number | null
          priority?: number
          provider?: string | null
          provider_id?: string | null
          role?: string | null
          rules?: string | null
          source?: string | null
          status?: string
          task?: string | null
          updated_at?: string
        }
        Update: {
          capabilities?: string[]
          caps?: Json
          category?: string
          context_window?: number | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          gateway_code?: string | null
          id?: string
          input_price_per_million?: number | null
          is_default?: boolean
          is_enabled?: boolean
          max_output_tokens?: number | null
          metadata?: Json
          modalities?: Json
          model_code?: string
          model_id?: string
          name?: string | null
          notes?: string | null
          output_price_per_million?: number | null
          priority?: number
          provider?: string | null
          provider_id?: string | null
          role?: string | null
          rules?: string | null
          source?: string | null
          status?: string
          task?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_key_secret_name: string
          base_url: string | null
          code: string
          created_at: string
          id: string
          is_enabled: boolean
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          api_key_secret_name: string
          base_url?: string | null
          code: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          api_key_secret_name?: string
          base_url?: string | null
          code?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost: number
          created_at: string
          error: string | null
          id: string
          input_tokens: number
          latency_ms: number | null
          metadata: Json
          model_id: string | null
          output_tokens: number
          site_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json
          model_id?: string | null
          output_tokens?: number
          site_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          metadata?: Json
          model_id?: string | null
          output_tokens?: number
          site_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      hn_apps: {
        Row: {
          app_code: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          site_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          app_code: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          site_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          app_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          site_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hn_apps_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      hn_roles: {
        Row: {
          access_level: number
          code: string
          created_at: string
          default_dashboard: string
          description: string | null
          id: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          access_level?: number
          code: string
          created_at?: string
          default_dashboard?: string
          description?: string | null
          id?: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          access_level?: number
          code?: string
          created_at?: string
          default_dashboard?: string
          description?: string | null
          id?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      hn_user_roles_apps: {
        Row: {
          app_id: string | null
          created_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hn_user_roles_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "hn_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hn_user_roles_apps_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "hn_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      hn_users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          last_login_at: string | null
          origin_app_id: string | null
          origin_domain: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          last_login_at?: string | null
          origin_app_id?: string | null
          origin_domain?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          last_login_at?: string | null
          origin_app_id?: string | null
          origin_domain?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hn_users_origin_app_id_fkey"
            columns: ["origin_app_id"]
            isOneToOne: false
            referencedRelation: "hn_apps"
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
      site_categories: {
        Row: {
          code_prefix: string
          color: string
          icon: string
          id: number
          name: string
          target_count: number
        }
        Insert: {
          code_prefix: string
          color: string
          icon: string
          id: number
          name: string
          target_count?: number
        }
        Update: {
          code_prefix?: string
          color?: string
          icon?: string
          id?: number
          name?: string
          target_count?: number
        }
        Relationships: []
      }
      site_link_agents: {
        Row: {
          created_at: string
          developer_agent_id: string | null
          extra_agent_ids: string[]
          hn_group: boolean
          id: string
          interaction_rate: number
          is_enabled: boolean
          last_sync_at: string | null
          link_status: string
          receiver_agent_id: string | null
          response_ms: number
          security_agent_id: string | null
          sender_agent_id: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_agent_id?: string | null
          extra_agent_ids?: string[]
          hn_group?: boolean
          id?: string
          interaction_rate?: number
          is_enabled?: boolean
          last_sync_at?: string | null
          link_status?: string
          receiver_agent_id?: string | null
          response_ms?: number
          security_agent_id?: string | null
          sender_agent_id?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_agent_id?: string | null
          extra_agent_ids?: string[]
          hn_group?: boolean
          id?: string
          interaction_rate?: number
          is_enabled?: boolean
          last_sync_at?: string | null
          link_status?: string
          receiver_agent_id?: string | null
          response_ms?: number
          security_agent_id?: string | null
          sender_agent_id?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_link_agents_developer_agent_id_fkey"
            columns: ["developer_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_link_agents_receiver_agent_id_fkey"
            columns: ["receiver_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_link_agents_security_agent_id_fkey"
            columns: ["security_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_link_agents_sender_agent_id_fkey"
            columns: ["sender_agent_id"]
            isOneToOne: false
            referencedRelation: "agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_link_agents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          activity_rate: number
          api_key_hash: string | null
          category_id: number | null
          client_id: string | null
          created_at: string | null
          db_name: string | null
          db_size_gb: number | null
          domain: string
          email: string | null
          health: string
          icon_color: string | null
          id: string
          integration_status: string
          last_heartbeat_at: string | null
          role: string | null
          services: Json
          site_code: string | null
          status: string
          storage_backend: string | null
          storage_gb: number | null
          updated_at: string
          users_count: number | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          activity_rate?: number
          api_key_hash?: string | null
          category_id?: number | null
          client_id?: string | null
          created_at?: string | null
          db_name?: string | null
          db_size_gb?: number | null
          domain: string
          email?: string | null
          health?: string
          icon_color?: string | null
          id?: string
          integration_status?: string
          last_heartbeat_at?: string | null
          role?: string | null
          services?: Json
          site_code?: string | null
          status?: string
          storage_backend?: string | null
          storage_gb?: number | null
          updated_at?: string
          users_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          activity_rate?: number
          api_key_hash?: string | null
          category_id?: number | null
          client_id?: string | null
          created_at?: string | null
          db_name?: string | null
          db_size_gb?: number | null
          domain?: string
          email?: string | null
          health?: string
          icon_color?: string | null
          id?: string
          integration_status?: string
          last_heartbeat_at?: string | null
          role?: string | null
          services?: Json
          site_code?: string | null
          status?: string
          storage_backend?: string | null
          storage_gb?: number | null
          updated_at?: string
          users_count?: number | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "site_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sites_provisioning: {
        Row: {
          api_key: string
          created_at: string
          exported_at: string | null
          id: string
          site_id: string
          webhook_secret: string
        }
        Insert: {
          api_key: string
          created_at?: string
          exported_at?: string | null
          id?: string
          site_id: string
          webhook_secret: string
        }
        Update: {
          api_key?: string
          created_at?: string
          exported_at?: string | null
          id?: string
          site_id?: string
          webhook_secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_provisioning_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
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
      user_ai_limits: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          monthly_request_cap: number | null
          monthly_token_cap: number | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_request_cap?: number | null
          monthly_token_cap?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_request_cap?: number | null
          monthly_token_cap?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
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
      _site_code_prefix: { Args: { color: string }; Returns: string }
      hn_my_dashboard: { Args: { _app_code?: string }; Returns: string }
    }
    Enums: {
      app_role: "owner" | "admin" | "agent" | "viewer" | "client" | "visitor"
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
      app_role: ["owner", "admin", "agent", "viewer", "client", "visitor"],
    },
  },
} as const
