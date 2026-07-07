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
      arrange_chains: {
        Row: {
          created_at: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      arrange_items: {
        Row: {
          chain_id: string
          created_at: string
          id: string
          image_path: string
          label: string
          position: number
        }
        Insert: {
          chain_id: string
          created_at?: string
          id?: string
          image_path: string
          label?: string
          position: number
        }
        Update: {
          chain_id?: string
          created_at?: string
          id?: string
          image_path?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "arrange_items_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "arrange_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          options: Json
          prompt: string
          ts_seconds: number
          video_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          options: Json
          prompt: string
          ts_seconds: number
          video_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          options?: Json
          prompt?: string
          ts_seconds?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_pairs: {
        Row: {
          created_at: string
          id: string
          left_image_path: string
          right_image_path: string
          set_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          left_image_path: string
          right_image_path: string
          set_id: string
        }
        Update: {
          created_at?: string
          id?: string
          left_image_path?: string
          right_image_path?: string
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connect_pairs_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "connect_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_sets: {
        Row: {
          created_at: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      game_assets: {
        Row: {
          created_at: string
          file_path: string
          game: string
          id: string
          label: string
          system: Database["public"]["Enums"]["body_system"]
        }
        Insert: {
          created_at?: string
          file_path: string
          game?: string
          id?: string
          label: string
          system: Database["public"]["Enums"]["body_system"]
        }
        Update: {
          created_at?: string
          file_path?: string
          game?: string
          id?: string
          label?: string
          system?: Database["public"]["Enums"]["body_system"]
        }
        Relationships: []
      }
      group_game_scores: {
        Row: {
          created_at: string
          game: string
          group_id: string
          id: string
          score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          game: string
          group_id: string
          id?: string
          score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          game?: string
          group_id?: string
          id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_game_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_match_choices: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_match_choices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_match_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_match_questions: {
        Row: {
          created_at: string
          id: string
          prompt_image_path: string
          question_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_image_path: string
          question_text?: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_image_path?: string
          question_text?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          options: Json
          position: number
          prompt: string
          video_id: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          options: Json
          position?: number
          prompt: string
          video_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          options?: Json
          position?: number
          prompt?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          correct_index: number
          created_at: string
          id: string
          is_correct: boolean
          options: Json
          picked_index: number
          prompt: string
          question_id: string | null
          source: string
          student_id: string
          video_id: string
          video_title: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          id?: string
          is_correct: boolean
          options: Json
          picked_index: number
          prompt: string
          question_id?: string | null
          source: string
          student_id: string
          video_id: string
          video_title: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          options?: Json
          picked_index?: number
          prompt?: string
          question_id?: string | null
          source?: string
          student_id?: string
          video_id?: string
          video_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          id: string
          name: string
          score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      trace_animals: {
        Row: {
          category: string
          created_at: string
          id: string
          image_path: string
          label: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_path: string
          label: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_path?: string
          label?: string
        }
        Relationships: []
      }
      trace_chains: {
        Row: {
          created_at: string
          id: string
          system: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          system?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          system?: string
          title?: string
        }
        Relationships: []
      }
      trace_organisms: {
        Row: {
          chain_id: string
          created_at: string
          file_path: string
          id: string
          label: string
          position: number
        }
        Insert: {
          chain_id: string
          created_at?: string
          file_path: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          chain_id?: string
          created_at?: string
          file_path?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "trace_organisms_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "trace_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          file_path: string
          id: string
          owner_id: string | null
          system: Database["public"]["Enums"]["body_system"]
          title: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          owner_id?: string | null
          system: Database["public"]["Enums"]["body_system"]
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          owner_id?: string | null
          system?: Database["public"]["Enums"]["body_system"]
          title?: string
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
      body_system: "food_chain" | "herbivore" | "carnivore" | "omnivore"
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
      body_system: ["food_chain", "herbivore", "carnivore", "omnivore"],
    },
  },
} as const
