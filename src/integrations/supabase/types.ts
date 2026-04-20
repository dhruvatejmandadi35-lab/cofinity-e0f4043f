export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          team_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          team_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          team_id?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          id: string
          is_reviewed: boolean
          link_url: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          id?: string
          is_reviewed?: boolean
          link_url?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          id?: string
          is_reviewed?: boolean
          link_url?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          submission_type: string
          team_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          submission_type?: string
          team_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          submission_type?: string
          team_id?: string
          title?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          color: string
          created_at: string
          criteria: string | null
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          criteria?: string | null
          description: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          criteria?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          manager_id: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          date_time: string
          description: string | null
          end_date_time: string | null
          id: string
          is_public: boolean
          is_virtual: boolean
          location: string | null
          meeting_link: string | null
          series_id: string | null
          team_id: string
          title: string
          waitlist_enabled: boolean
        }
        Insert: {
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          date_time: string
          description?: string | null
          end_date_time?: string | null
          id?: string
          is_public?: boolean
          is_virtual?: boolean
          location?: string | null
          meeting_link?: string | null
          series_id?: string | null
          team_id: string
          title: string
          waitlist_enabled?: boolean
        }
        Update: {
          capacity?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          date_time?: string
          description?: string | null
          end_date_time?: string | null
          id?: string
          is_public?: boolean
          is_virtual?: boolean
          location?: string | null
          meeting_link?: string | null
          series_id?: string | null
          team_id?: string
          title?: string
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          color: string
          id: number
          min_points: number
          name: string
          perks: string[] | null
        }
        Insert: {
          color: string
          id: number
          min_points: number
          name: string
          perks?: string[] | null
        }
        Update: {
          color?: string
          id?: number
          min_points?: number
          name?: string
          perks?: string[] | null
        }
        Relationships: []
      }
      member_spotlights: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          score: number
          team_id: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          score?: number
          team_id: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          score?: number
          team_id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          is_pinned: boolean
          parent_id: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          parent_id?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_leaderboard: {
        Row: {
          created_at: string
          id: string
          month: number
          org_id: string | null
          points: number
          rank: number | null
          team_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          org_id?: string | null
          points?: number
          rank?: number | null
          team_id?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          org_id?: string | null
          points?: number
          rank?: number | null
          team_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      org_followers: {
        Row: {
          followed_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          followed_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          followed_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          invite_code: string | null
          invite_expires_at: string | null
          is_featured: boolean
          is_verified: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          is_featured?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          is_featured?: boolean
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          label: string
          poll_id: string
          position: number
        }
        Insert: {
          id?: string
          label: string
          poll_id: string
          position?: number
        }
        Update: {
          id?: string
          label?: string
          poll_id?: string
          position?: number
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: []
      }
      polls: {
        Row: {
          author_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_multiple_choice: boolean
          question: string
          team_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_multiple_choice?: boolean
          question: string
          team_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_multiple_choice?: boolean
          question?: string
          team_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          all_time_points: number | null
          attendance_streak: number
          avatar_url: string | null
          bio: string | null
          birthday: string | null
          birthday_public: boolean
          created_at: string
          current_level: number | null
          display_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          last_check_in_at: string | null
          location: string | null
          longest_streak: number
          monthly_points: number | null
          show_age: boolean
          skills: string[] | null
          total_hours: number
          unlocked_perks: string[] | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          all_time_points?: number | null
          attendance_streak?: number
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          birthday_public?: boolean
          created_at?: string
          current_level?: number | null
          display_name?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          last_check_in_at?: string | null
          location?: string | null
          longest_streak?: number
          monthly_points?: number | null
          show_age?: boolean
          skills?: string[] | null
          total_hours?: number
          unlocked_perks?: string[] | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          all_time_points?: number | null
          attendance_streak?: number
          avatar_url?: string | null
          bio?: string | null
          birthday?: string | null
          birthday_public?: boolean
          created_at?: string
          current_level?: number | null
          display_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          last_check_in_at?: string | null
          location?: string | null
          longest_streak?: number
          monthly_points?: number | null
          show_age?: boolean
          skills?: string[] | null
          total_hours?: number
          unlocked_perks?: string[] | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_columns: {
        Row: {
          color: string | null
          created_at: string
          id: string
          position: number
          team_id: string
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          team_id: string
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          position?: number
          team_id?: string
          title?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          column_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          column_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          column_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          org_id: string | null
          target_user_id: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          org_id?: string | null
          target_user_id?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          org_id?: string | null
          target_user_id?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      team_docs: {
        Row: {
          author_id: string
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean
          last_edited_by: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_edited_by?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          last_edited_by?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          color: string | null
          created_at: string
          custom_welcome_message: string | null
          department_id: string
          description: string | null
          emoji: string | null
          founded_date: string | null
          id: string
          invite_code: string | null
          invite_expires_at: string | null
          invite_max_uses: number | null
          invite_use_count: number
          motto: string | null
          name: string
          owner_id: string
          privacy: Database["public"]["Enums"]["team_privacy"]
          slug: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          color?: string | null
          created_at?: string
          custom_welcome_message?: string | null
          department_id: string
          description?: string | null
          emoji?: string | null
          founded_date?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_max_uses?: number | null
          invite_use_count?: number
          motto?: string | null
          name: string
          owner_id: string
          privacy?: Database["public"]["Enums"]["team_privacy"]
          slug?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          color?: string | null
          created_at?: string
          custom_welcome_message?: string | null
          department_id?: string
          description?: string | null
          emoji?: string | null
          founded_date?: string | null
          id?: string
          invite_code?: string | null
          invite_expires_at?: string | null
          invite_max_uses?: number | null
          invite_use_count?: number
          motto?: string | null
          name?: string
          owner_id?: string
          privacy?: Database["public"]["Enums"]["team_privacy"]
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          id: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          id?: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          id?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          points: number
          reference_id: string | null
          source: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          points: number
          reference_id?: string | null
          source: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          points?: number
          reference_id?: string | null
          source?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      welcome_shown: {
        Row: {
          id: string
          shown_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          shown_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          shown_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "member"
      org_type: "school" | "company" | "community"
      team_privacy: "public" | "private" | "secret"
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
      app_role: ["owner", "admin", "manager", "member"],
      org_type: ["school", "company", "community"],
      team_privacy: ["public", "private", "secret"],
    },
  },
} as const
