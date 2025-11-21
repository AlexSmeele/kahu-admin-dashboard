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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_goals: {
        Row: {
          activity_level: string
          created_at: string
          dog_id: string
          id: string
          is_active: boolean | null
          target_distance_km: number | null
          target_minutes: number
          updated_at: string
        }
        Insert: {
          activity_level?: string
          created_at?: string
          dog_id: string
          id?: string
          is_active?: boolean | null
          target_distance_km?: number | null
          target_minutes?: number
          updated_at?: string
        }
        Update: {
          activity_level?: string
          created_at?: string
          dog_id?: string
          id?: string
          is_active?: boolean | null
          target_distance_km?: number | null
          target_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_goals_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_records: {
        Row: {
          activity_type: string
          calories_burned: number | null
          created_at: string
          distance_km: number | null
          dog_id: string
          duration_minutes: number | null
          end_time: string | null
          gps_data: Json | null
          id: string
          notes: string | null
          start_time: string
          tracking_method: string | null
          updated_at: string
        }
        Insert: {
          activity_type: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          dog_id: string
          duration_minutes?: number | null
          end_time?: string | null
          gps_data?: Json | null
          id?: string
          notes?: string | null
          start_time: string
          tracking_method?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string
          calories_burned?: number | null
          created_at?: string
          distance_km?: number | null
          dog_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          gps_data?: Json | null
          id?: string
          notes?: string | null
          start_time?: string
          tracking_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_content_tables: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          route_override: string | null
          schema_definition: Json
          section_id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          route_override?: string | null
          schema_definition?: Json
          section_id: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          route_override?: string | null
          schema_definition?: Json
          section_id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_content_tables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "admin_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sections: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          badge_tier: string
          created_at: string
          id: string
          issued_at: string
          name_on_cert: string
          pdf_url: string | null
          readiness_score: number | null
          score_pct: number
          share_url: string | null
          user_id: string
        }
        Insert: {
          badge_tier: string
          created_at?: string
          id?: string
          issued_at?: string
          name_on_cert: string
          pdf_url?: string | null
          readiness_score?: number | null
          score_pct: number
          share_url?: string | null
          user_id: string
        }
        Update: {
          badge_tier?: string
          created_at?: string
          id?: string
          issued_at?: string
          name_on_cert?: string
          pdf_url?: string | null
          readiness_score?: number | null
          score_pct?: number
          share_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number
          id: string
          is_published: boolean
          order_index: number
          tags: Json
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes: number
          id?: string
          is_published?: boolean
          order_index: number
          tags?: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          order_index?: number
          tags?: Json
          title?: string
        }
        Relationships: []
      }
      custom_breeds: {
        Row: {
          created_at: string
          description: string | null
          exercise_needs_override: string | null
          grooming_needs_override: string | null
          health_notes_override: string | null
          id: string
          name: string
          notes: string | null
          parent_breed_1_id: string | null
          parent_breed_1_percentage: number | null
          parent_breed_2_id: string | null
          parent_breed_2_percentage: number | null
          parent_breed_3_id: string | null
          parent_breed_3_percentage: number | null
          temperament_override: string | null
          updated_at: string
          user_id: string
          weight_female_adult_max_override: number | null
          weight_female_adult_min_override: number | null
          weight_male_adult_max_override: number | null
          weight_male_adult_min_override: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          exercise_needs_override?: string | null
          grooming_needs_override?: string | null
          health_notes_override?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_breed_1_id?: string | null
          parent_breed_1_percentage?: number | null
          parent_breed_2_id?: string | null
          parent_breed_2_percentage?: number | null
          parent_breed_3_id?: string | null
          parent_breed_3_percentage?: number | null
          temperament_override?: string | null
          updated_at?: string
          user_id: string
          weight_female_adult_max_override?: number | null
          weight_female_adult_min_override?: number | null
          weight_male_adult_max_override?: number | null
          weight_male_adult_min_override?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          exercise_needs_override?: string | null
          grooming_needs_override?: string | null
          health_notes_override?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_breed_1_id?: string | null
          parent_breed_1_percentage?: number | null
          parent_breed_2_id?: string | null
          parent_breed_2_percentage?: number | null
          parent_breed_3_id?: string | null
          parent_breed_3_percentage?: number | null
          temperament_override?: string | null
          updated_at?: string
          user_id?: string
          weight_female_adult_max_override?: number | null
          weight_female_adult_min_override?: number | null
          weight_male_adult_max_override?: number | null
          weight_male_adult_min_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_breeds_parent_breed_1_id_fkey"
            columns: ["parent_breed_1_id"]
            isOneToOne: false
            referencedRelation: "dog_breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_breeds_parent_breed_2_id_fkey"
            columns: ["parent_breed_2_id"]
            isOneToOne: false
            referencedRelation: "dog_breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_breeds_parent_breed_3_id_fkey"
            columns: ["parent_breed_3_id"]
            isOneToOne: false
            referencedRelation: "dog_breeds"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_breed_health_issues: {
        Row: {
          breed_id: string
          created_at: string
          health_issue_id: string
          id: string
        }
        Insert: {
          breed_id: string
          created_at?: string
          health_issue_id: string
          id?: string
        }
        Update: {
          breed_id?: string
          created_at?: string
          health_issue_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_breed_health_issues_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "dog_breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_breed_health_issues_health_issue_id_fkey"
            columns: ["health_issue_id"]
            isOneToOne: false
            referencedRelation: "dog_health_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_breeds: {
        Row: {
          also_known_as: string | null
          breed: string
          coat: string | null
          common_health_issues: string | null
          created_at: string
          enrichment_confidence: string | null
          exercise_level: string | null
          exercise_needs: string | null
          fci_group: number | null
          female_weight_6m_kg_max: number | null
          female_weight_6m_kg_min: number | null
          female_weight_adult_kg_max: number | null
          female_weight_adult_kg_min: number | null
          grooming: string | null
          grooming_needs: string | null
          health_notes_confidence: string | null
          health_prevalence_notes: string | null
          health_watchlist_tags: string | null
          id: string
          life_span_years: string | null
          male_weight_6m_kg_max: number | null
          male_weight_6m_kg_min: number | null
          male_weight_adult_kg_max: number | null
          male_weight_adult_kg_min: number | null
          origin: string | null
          recognized_by: string | null
          recommended_screenings: string | null
          temperament: string | null
          trainability: string | null
          updated_at: string
          weights_confidence: string | null
        }
        Insert: {
          also_known_as?: string | null
          breed: string
          coat?: string | null
          common_health_issues?: string | null
          created_at?: string
          enrichment_confidence?: string | null
          exercise_level?: string | null
          exercise_needs?: string | null
          fci_group?: number | null
          female_weight_6m_kg_max?: number | null
          female_weight_6m_kg_min?: number | null
          female_weight_adult_kg_max?: number | null
          female_weight_adult_kg_min?: number | null
          grooming?: string | null
          grooming_needs?: string | null
          health_notes_confidence?: string | null
          health_prevalence_notes?: string | null
          health_watchlist_tags?: string | null
          id?: string
          life_span_years?: string | null
          male_weight_6m_kg_max?: number | null
          male_weight_6m_kg_min?: number | null
          male_weight_adult_kg_max?: number | null
          male_weight_adult_kg_min?: number | null
          origin?: string | null
          recognized_by?: string | null
          recommended_screenings?: string | null
          temperament?: string | null
          trainability?: string | null
          updated_at?: string
          weights_confidence?: string | null
        }
        Update: {
          also_known_as?: string | null
          breed?: string
          coat?: string | null
          common_health_issues?: string | null
          created_at?: string
          enrichment_confidence?: string | null
          exercise_level?: string | null
          exercise_needs?: string | null
          fci_group?: number | null
          female_weight_6m_kg_max?: number | null
          female_weight_6m_kg_min?: number | null
          female_weight_adult_kg_max?: number | null
          female_weight_adult_kg_min?: number | null
          grooming?: string | null
          grooming_needs?: string | null
          health_notes_confidence?: string | null
          health_prevalence_notes?: string | null
          health_watchlist_tags?: string | null
          id?: string
          life_span_years?: string | null
          male_weight_6m_kg_max?: number | null
          male_weight_6m_kg_min?: number | null
          male_weight_adult_kg_max?: number | null
          male_weight_adult_kg_min?: number | null
          origin?: string | null
          recognized_by?: string | null
          recommended_screenings?: string | null
          temperament?: string | null
          trainability?: string | null
          updated_at?: string
          weights_confidence?: string | null
        }
        Relationships: []
      }
      dog_groomers: {
        Row: {
          created_at: string | null
          dog_id: string
          groomer_id: string
          id: string
          is_preferred: boolean | null
          preferred_groomer_name: string | null
          relationship_notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dog_id: string
          groomer_id: string
          id?: string
          is_preferred?: boolean | null
          preferred_groomer_name?: string | null
          relationship_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dog_id?: string
          groomer_id?: string
          id?: string
          is_preferred?: boolean | null
          preferred_groomer_name?: string | null
          relationship_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_groomers_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_groomers_groomer_id_fkey"
            columns: ["groomer_id"]
            isOneToOne: false
            referencedRelation: "groomers"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_health_issues: {
        Row: {
          category: string | null
          created_at: string
          first_line_screening: string | null
          id: string
          name: string
          notes: string | null
          subcategory: string | null
          typical_signs: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          first_line_screening?: string | null
          id?: string
          name: string
          notes?: string | null
          subcategory?: string | null
          typical_signs?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          first_line_screening?: string | null
          id?: string
          name?: string
          notes?: string | null
          subcategory?: string | null
          typical_signs?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dog_notes: {
        Row: {
          content: string
          created_at: string
          dog_id: string
          id: string
          media_type: string | null
          media_url: string | null
          note_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          dog_id: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          note_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          dog_id?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          note_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_notes_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_skills: {
        Row: {
          basic_completed_at: string | null
          created_at: string
          dog_id: string
          generalized_completed_at: string | null
          id: string
          last_practiced_at: string | null
          mastered_at: string | null
          practice_contexts: Json | null
          proficiency_level: string
          proofed_completed_at: string | null
          skill_id: string
          started_at: string | null
          status: string
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          basic_completed_at?: string | null
          created_at?: string
          dog_id: string
          generalized_completed_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_contexts?: Json | null
          proficiency_level?: string
          proofed_completed_at?: string | null
          skill_id: string
          started_at?: string | null
          status?: string
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          basic_completed_at?: string | null
          created_at?: string
          dog_id?: string
          generalized_completed_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastered_at?: string | null
          practice_contexts?: Json | null
          proficiency_level?: string
          proofed_completed_at?: string | null
          skill_id?: string
          started_at?: string | null
          status?: string
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_tricks_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_vet_clinics: {
        Row: {
          created_at: string
          dog_id: string
          id: string
          is_primary: boolean | null
          relationship_notes: string | null
          updated_at: string
          vet_clinic_id: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          id?: string
          is_primary?: boolean | null
          relationship_notes?: string | null
          updated_at?: string
          vet_clinic_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          id?: string
          is_primary?: boolean | null
          relationship_notes?: string | null
          updated_at?: string
          vet_clinic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_vet_clinics_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_vet_clinics_vet_clinic_id_fkey"
            columns: ["vet_clinic_id"]
            isOneToOne: false
            referencedRelation: "vet_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_walkers: {
        Row: {
          created_at: string | null
          dog_id: string
          id: string
          is_preferred: boolean | null
          preferred_days: string | null
          relationship_notes: string | null
          updated_at: string | null
          walker_id: string
        }
        Insert: {
          created_at?: string | null
          dog_id: string
          id?: string
          is_preferred?: boolean | null
          preferred_days?: string | null
          relationship_notes?: string | null
          updated_at?: string | null
          walker_id: string
        }
        Update: {
          created_at?: string | null
          dog_id?: string
          id?: string
          is_preferred?: boolean | null
          preferred_days?: string | null
          relationship_notes?: string | null
          updated_at?: string | null
          walker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dog_dog_walkers_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_walkers_walker_id_fkey"
            columns: ["walker_id"]
            isOneToOne: false
            referencedRelation: "walkers"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          behavioral_goals: Json | null
          birthday: string | null
          breed_id: string | null
          created_at: string
          custom_breed_id: string | null
          family_id: string | null
          gender: string | null
          id: string
          is_shelter_dog: boolean | null
          known_commands: Json | null
          name: string
          sort_order: number | null
          training_time_commitment: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          behavioral_goals?: Json | null
          birthday?: string | null
          breed_id?: string | null
          created_at?: string
          custom_breed_id?: string | null
          family_id?: string | null
          gender?: string | null
          id?: string
          is_shelter_dog?: boolean | null
          known_commands?: Json | null
          name: string
          sort_order?: number | null
          training_time_commitment?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          behavioral_goals?: Json | null
          birthday?: string | null
          breed_id?: string | null
          created_at?: string
          custom_breed_id?: string | null
          family_id?: string | null
          gender?: string | null
          id?: string
          is_shelter_dog?: boolean | null
          known_commands?: Json | null
          name?: string
          sort_order?: number | null
          training_time_commitment?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dogs_custom_breed_id_fkey"
            columns: ["custom_breed_id"]
            isOneToOne: false
            referencedRelation: "custom_breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dogs_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dogs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dogs_breed_id"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "dog_breeds"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          family_id: string
          id?: string
          invited_by: string
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          family_id?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          joined_at: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_inventory: {
        Row: {
          alert_enabled: boolean | null
          batch_lot_number: string | null
          brand: string | null
          created_at: string
          dog_id: string
          expiration_date: string | null
          food_name: string
          food_type: string
          id: string
          low_stock_alert_threshold: number | null
          opened_date: string | null
          purchase_cost: number | null
          purchase_date: string | null
          quantity_remaining: number
          storage_location: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          alert_enabled?: boolean | null
          batch_lot_number?: string | null
          brand?: string | null
          created_at?: string
          dog_id: string
          expiration_date?: string | null
          food_name: string
          food_type: string
          id?: string
          low_stock_alert_threshold?: number | null
          opened_date?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity_remaining?: number
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          alert_enabled?: boolean | null
          batch_lot_number?: string | null
          brand?: string | null
          created_at?: string
          dog_id?: string
          expiration_date?: string | null
          food_name?: string
          food_type?: string
          id?: string
          low_stock_alert_threshold?: number | null
          opened_date?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity_remaining?: number
          storage_location?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      foundation_modules: {
        Row: {
          brief_description: string
          brief_steps: Json
          category: string
          created_at: string
          detailed_description: string
          detailed_steps: Json
          estimated_minutes: number
          format: string
          id: string
          ideal_stage: string
          images: Json | null
          is_published: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          brief_description: string
          brief_steps?: Json
          category: string
          created_at?: string
          detailed_description: string
          detailed_steps?: Json
          estimated_minutes: number
          format: string
          id?: string
          ideal_stage: string
          images?: Json | null
          is_published?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          brief_description?: string
          brief_steps?: Json
          category?: string
          created_at?: string
          detailed_description?: string
          detailed_steps?: Json
          estimated_minutes?: number
          format?: string
          id?: string
          ideal_stage?: string
          images?: Json | null
          is_published?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      groomers: {
        Row: {
          address: string
          business_name: string | null
          created_at: string | null
          email: string | null
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          rating: number | null
          services: string[] | null
          specialties: string[] | null
          updated_at: string | null
          user_ratings_total: number | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address: string
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          rating?: number | null
          services?: string[] | null
          specialties?: string[] | null
          updated_at?: string | null
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          rating?: number | null
          services?: string[] | null
          specialties?: string[] | null
          updated_at?: string | null
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      grooming_completions: {
        Row: {
          completed_at: string
          created_at: string
          dog_id: string
          id: string
          notes: string | null
          photos: string[] | null
          schedule_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          dog_id: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          schedule_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          dog_id?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grooming_completions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "grooming_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      grooming_schedules: {
        Row: {
          created_at: string
          dog_id: string
          frequency_days: number
          grooming_type: string
          how_to_guide: string | null
          how_to_video_url: string | null
          id: string
          last_completed_at: string | null
          next_due_date: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dog_id: string
          frequency_days?: number
          grooming_type: string
          how_to_guide?: string | null
          how_to_video_url?: string | null
          id?: string
          last_completed_at?: string | null
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dog_id?: string
          frequency_days?: number
          grooming_type?: string
          how_to_guide?: string | null
          how_to_video_url?: string | null
          id?: string
          last_completed_at?: string | null
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_checkups: {
        Row: {
          behavior_changes: string | null
          body_condition_score: number | null
          checkup_date: string
          created_at: string
          dog_id: string
          ear_condition: string | null
          ear_notes: string | null
          eye_condition: string | null
          eye_notes: string | null
          id: string
          lump_notes: string | null
          lumps_found: boolean | null
          overall_notes: string | null
          skin_condition: string | null
          skin_notes: string | null
          updated_at: string
        }
        Insert: {
          behavior_changes?: string | null
          body_condition_score?: number | null
          checkup_date?: string
          created_at?: string
          dog_id: string
          ear_condition?: string | null
          ear_notes?: string | null
          eye_condition?: string | null
          eye_notes?: string | null
          id?: string
          lump_notes?: string | null
          lumps_found?: boolean | null
          overall_notes?: string | null
          skin_condition?: string | null
          skin_notes?: string | null
          updated_at?: string
        }
        Update: {
          behavior_changes?: string | null
          body_condition_score?: number | null
          checkup_date?: string
          created_at?: string
          dog_id?: string
          ear_condition?: string | null
          ear_notes?: string | null
          eye_condition?: string | null
          eye_notes?: string | null
          id?: string
          lump_notes?: string | null
          lumps_found?: boolean | null
          overall_notes?: string | null
          skin_condition?: string | null
          skin_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          date: string
          description: string | null
          dog_id: string
          id: string
          notes: string | null
          record_type: string
          title: string
          updated_at: string
          vet_clinic_id: string | null
          veterinarian: string | null
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          dog_id: string
          id?: string
          notes?: string | null
          record_type: string
          title: string
          updated_at?: string
          vet_clinic_id?: string | null
          veterinarian?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          dog_id?: string
          id?: string
          notes?: string | null
          record_type?: string
          title?: string
          updated_at?: string
          vet_clinic_id?: string | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_vet_clinic_id_fkey"
            columns: ["vet_clinic_id"]
            isOneToOne: false
            referencedRelation: "vet_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      kv_store_40e514ed: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_type: string
          module_id: string
          order_index: number
          personalization_rules: Json | null
          title: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_type: string
          module_id: string
          order_index: number
          personalization_rules?: Json | null
          title: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_type?: string
          module_id?: string
          order_index?: number
          personalization_rules?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lifestyle_profiles: {
        Row: {
          activity_level: string
          allergies: boolean
          budget_monthly_nzd: number
          created_at: string
          experience: string
          home_type: string
          household_adults: number
          household_children: number
          household_seniors: number
          id: string
          outdoor_space: string
          preferences: Json
          target_timeline_months: number | null
          travel_frequency: string
          updated_at: string
          user_id: string
          weekday_hours_away: number
          weekend_hours_away: number
        }
        Insert: {
          activity_level: string
          allergies?: boolean
          budget_monthly_nzd?: number
          created_at?: string
          experience: string
          home_type: string
          household_adults?: number
          household_children?: number
          household_seniors?: number
          id?: string
          outdoor_space: string
          preferences?: Json
          target_timeline_months?: number | null
          travel_frequency: string
          updated_at?: string
          user_id: string
          weekday_hours_away?: number
          weekend_hours_away?: number
        }
        Update: {
          activity_level?: string
          allergies?: boolean
          budget_monthly_nzd?: number
          created_at?: string
          experience?: string
          home_type?: string
          household_adults?: number
          household_children?: number
          household_seniors?: number
          id?: string
          outdoor_space?: string
          preferences?: Json
          target_timeline_months?: number | null
          travel_frequency?: string
          updated_at?: string
          user_id?: string
          weekday_hours_away?: number
          weekend_hours_away?: number
        }
        Relationships: []
      }
      meal_records: {
        Row: {
          amount_consumed: number | null
          amount_given: number | null
          amount_planned: number | null
          begged_after: boolean | null
          begged_before: boolean | null
          bowl_cleaned_before: boolean | null
          completed_at: string | null
          created_at: string
          dog_id: string
          eating_behavior: string | null
          eating_speed: string | null
          energy_level_after: string | null
          fed_by: string | null
          food_temperature: string | null
          id: string
          meal_components: Json | null
          meal_name: string
          meal_time: string
          notes: string | null
          nutrition_plan_id: string
          percentage_eaten: number | null
          scheduled_date: string
          snubbed_items: Json | null
          updated_at: string
          vomit_time_minutes: number | null
          vomited_after: boolean | null
        }
        Insert: {
          amount_consumed?: number | null
          amount_given?: number | null
          amount_planned?: number | null
          begged_after?: boolean | null
          begged_before?: boolean | null
          bowl_cleaned_before?: boolean | null
          completed_at?: string | null
          created_at?: string
          dog_id: string
          eating_behavior?: string | null
          eating_speed?: string | null
          energy_level_after?: string | null
          fed_by?: string | null
          food_temperature?: string | null
          id?: string
          meal_components?: Json | null
          meal_name: string
          meal_time: string
          notes?: string | null
          nutrition_plan_id: string
          percentage_eaten?: number | null
          scheduled_date: string
          snubbed_items?: Json | null
          updated_at?: string
          vomit_time_minutes?: number | null
          vomited_after?: boolean | null
        }
        Update: {
          amount_consumed?: number | null
          amount_given?: number | null
          amount_planned?: number | null
          begged_after?: boolean | null
          begged_before?: boolean | null
          bowl_cleaned_before?: boolean | null
          completed_at?: string | null
          created_at?: string
          dog_id?: string
          eating_behavior?: string | null
          eating_speed?: string | null
          energy_level_after?: string | null
          fed_by?: string | null
          food_temperature?: string | null
          id?: string
          meal_components?: Json | null
          meal_name?: string
          meal_time?: string
          notes?: string | null
          nutrition_plan_id?: string
          percentage_eaten?: number | null
          scheduled_date?: string
          snubbed_items?: Json | null
          updated_at?: string
          vomit_time_minutes?: number | null
          vomited_after?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          file_url: string
          id: string
          is_published: boolean | null
          media_type: string
          mime_type: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          is_published?: boolean | null
          media_type: string
          mime_type?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          is_published?: boolean | null
          media_type?: string
          mime_type?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_treatments: {
        Row: {
          created_at: string
          dog_id: string
          frequency_weeks: number
          id: string
          last_administered_date: string
          next_due_date: string | null
          notes: string | null
          treatment_name: string
          updated_at: string
          vet_clinic_id: string | null
        }
        Insert: {
          created_at?: string
          dog_id: string
          frequency_weeks: number
          id?: string
          last_administered_date: string
          next_due_date?: string | null
          notes?: string | null
          treatment_name: string
          updated_at?: string
          vet_clinic_id?: string | null
        }
        Update: {
          created_at?: string
          dog_id?: string
          frequency_weeks?: number
          id?: string
          last_administered_date?: string
          next_due_date?: string | null
          notes?: string | null
          treatment_name?: string
          updated_at?: string
          vet_clinic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_treatments_vet_clinic_id_fkey"
            columns: ["vet_clinic_id"]
            isOneToOne: false
            referencedRelation: "vet_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reports: {
        Row: {
          admin_notes: string | null
          conversation_context: Json | null
          created_at: string
          dog_id: string | null
          id: string
          message_content: string
          report_details: string | null
          report_reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          conversation_context?: Json | null
          created_at?: string
          dog_id?: string | null
          id?: string
          message_content: string
          report_details?: string | null
          report_reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          conversation_context?: Json | null
          created_at?: string
          dog_id?: string | null
          id?: string
          message_content?: string
          report_details?: string | null
          report_reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reports_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          dog_id: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          scheduled_for: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          dog_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          scheduled_for?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          dog_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          scheduled_for?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          batch_lot_number: string | null
          bowl_last_cleaned: string | null
          bowl_type: string | null
          brand: string | null
          calorie_target_daily: number | null
          carbs_percentage: number | null
          created_at: string
          daily_amount: number | null
          diet_type: string | null
          dog_id: string
          fat_percentage: number | null
          feeding_method: string | null
          feeding_times: number | null
          fiber_percentage: number | null
          food_bag_opened_date: string | null
          food_expiration_date: string | null
          food_type: string
          id: string
          is_active: boolean | null
          meal_schedule: Json | null
          protein_percentage: number | null
          special_instructions: string | null
          updated_at: string
          water_bowl_last_cleaned: string | null
        }
        Insert: {
          batch_lot_number?: string | null
          bowl_last_cleaned?: string | null
          bowl_type?: string | null
          brand?: string | null
          calorie_target_daily?: number | null
          carbs_percentage?: number | null
          created_at?: string
          daily_amount?: number | null
          diet_type?: string | null
          dog_id: string
          fat_percentage?: number | null
          feeding_method?: string | null
          feeding_times?: number | null
          fiber_percentage?: number | null
          food_bag_opened_date?: string | null
          food_expiration_date?: string | null
          food_type: string
          id?: string
          is_active?: boolean | null
          meal_schedule?: Json | null
          protein_percentage?: number | null
          special_instructions?: string | null
          updated_at?: string
          water_bowl_last_cleaned?: string | null
        }
        Update: {
          batch_lot_number?: string | null
          bowl_last_cleaned?: string | null
          bowl_type?: string | null
          brand?: string | null
          calorie_target_daily?: number | null
          carbs_percentage?: number | null
          created_at?: string
          daily_amount?: number | null
          diet_type?: string | null
          dog_id?: string
          fat_percentage?: number | null
          feeding_method?: string | null
          feeding_times?: number | null
          fiber_percentage?: number | null
          food_bag_opened_date?: string | null
          food_expiration_date?: string | null
          food_type?: string
          id?: string
          is_active?: boolean | null
          meal_schedule?: Json | null
          protein_percentage?: number | null
          special_instructions?: string | null
          updated_at?: string
          water_bowl_last_cleaned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          notification_preferences: Json | null
          phone: string | null
          role: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          choices: Json | null
          correct_answer: string | null
          created_at: string
          id: string
          media_url: string | null
          question_type: string
          quiz_id: string
          rationale: string | null
          stem: string
          tags: Json
          weight: number
        }
        Insert: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          question_type: string
          quiz_id: string
          rationale?: string | null
          stem: string
          tags?: Json
          weight?: number
        }
        Update: {
          choices?: Json | null
          correct_answer?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          question_type?: string
          quiz_id?: string
          rationale?: string | null
          stem?: string
          tags?: Json
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          score_pct: number
          tag_breakdown: Json | null
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          score_pct: number
          tag_breakdown?: Json | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          score_pct?: number
          tag_breakdown?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string
          id: string
          options: Json
          order_index: number
          question: string
          quiz_id: string
          tags: string[] | null
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation: string
          id?: string
          options?: Json
          order_index: number
          question: string
          quiz_id: string
          tags?: string[] | null
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string
          id?: string
          options?: Json
          order_index?: number
          question?: string
          quiz_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          module_id: string | null
          pass_percentage: number
          pull_from_tags: Json | null
          quiz_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id?: string | null
          pass_percentage?: number
          pull_from_tags?: Json | null
          quiz_type: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string | null
          pass_percentage?: number
          pull_from_tags?: Json | null
          quiz_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          dog_profiles: Json
          id: string
          next_steps: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_profiles?: Json
          id?: string
          next_steps?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          dog_profiles?: Json
          id?: string
          next_steps?: Json
          user_id?: string
        }
        Relationships: []
      }
      saved_messages: {
        Row: {
          conversation_context: Json | null
          created_at: string
          dog_id: string | null
          id: string
          message_content: string
          notes: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_context?: Json | null
          created_at?: string
          dog_id?: string | null
          id?: string
          message_content: string
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_context?: Json | null
          created_at?: string
          dog_id?: string | null
          id?: string
          message_content?: string
          notes?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_messages_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_messages_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migration_history: {
        Row: {
          affected_rows: number | null
          changes: Json
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          migration_type: string
          sql_executed: string | null
          success: boolean
          table_id: string
          table_name: string
        }
        Insert: {
          affected_rows?: number | null
          changes: Json
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          migration_type: string
          sql_executed?: string | null
          success?: boolean
          table_id: string
          table_name: string
        }
        Update: {
          affected_rows?: number | null
          changes?: Json
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          migration_type?: string
          sql_executed?: string | null
          success?: boolean
          table_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schema_migration_history_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "admin_content_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_progression_requirements: {
        Row: {
          contexts_required: Json | null
          created_at: string
          description: string | null
          id: string
          min_sessions_required: number
          proficiency_level: string
          trick_id: string
        }
        Insert: {
          contexts_required?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          min_sessions_required?: number
          proficiency_level: string
          trick_id: string
        }
        Update: {
          contexts_required?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          min_sessions_required?: number
          proficiency_level?: string
          trick_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_progression_requirements_trick_id_fkey"
            columns: ["trick_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          achievement_levels: Json | null
          brief_instructions: Json | null
          category: string[]
          created_at: string
          criteria: Json | null
          detailed_instructions: Json | null
          difficulty_level: number
          estimated_time_weeks: number | null
          fail_criteria: string | null
          general_tips: string | null
          id: string
          ideal_stage_timeline: Json | null
          images: Json | null
          long_description: string | null
          mastery_criteria: string | null
          min_age_weeks: number | null
          name: string
          pass_criteria: string | null
          preparation_tips: string | null
          prerequisites: string[] | null
          priority_order: number | null
          recommended_practice_frequency_days: number | null
          short_description: string | null
          skill_type: string | null
          training_insights: string | null
          troubleshooting: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          achievement_levels?: Json | null
          brief_instructions?: Json | null
          category: string[]
          created_at?: string
          criteria?: Json | null
          detailed_instructions?: Json | null
          difficulty_level: number
          estimated_time_weeks?: number | null
          fail_criteria?: string | null
          general_tips?: string | null
          id?: string
          ideal_stage_timeline?: Json | null
          images?: Json | null
          long_description?: string | null
          mastery_criteria?: string | null
          min_age_weeks?: number | null
          name: string
          pass_criteria?: string | null
          preparation_tips?: string | null
          prerequisites?: string[] | null
          priority_order?: number | null
          recommended_practice_frequency_days?: number | null
          short_description?: string | null
          skill_type?: string | null
          training_insights?: string | null
          troubleshooting?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          achievement_levels?: Json | null
          brief_instructions?: Json | null
          category?: string[]
          created_at?: string
          criteria?: Json | null
          detailed_instructions?: Json | null
          difficulty_level?: number
          estimated_time_weeks?: number | null
          fail_criteria?: string | null
          general_tips?: string | null
          id?: string
          ideal_stage_timeline?: Json | null
          images?: Json | null
          long_description?: string | null
          mastery_criteria?: string | null
          min_age_weeks?: number | null
          name?: string
          pass_criteria?: string | null
          preparation_tips?: string | null
          prerequisites?: string[] | null
          priority_order?: number | null
          recommended_practice_frequency_days?: number | null
          short_description?: string | null
          skill_type?: string | null
          training_insights?: string | null
          troubleshooting?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      training_program_lessons: {
        Row: {
          category: string
          content: Json
          created_at: string
          estimated_minutes: number | null
          id: string
          lesson_type: string
          order_index: number | null
          prerequisites: string[] | null
          title: string
          updated_at: string
          week_id: string
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          lesson_type: string
          order_index?: number | null
          prerequisites?: string[] | null
          title: string
          updated_at?: string
          week_id: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          lesson_type?: string
          order_index?: number | null
          prerequisites?: string[] | null
          title?: string
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_program_lessons_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "training_program_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_program_weeks: {
        Row: {
          created_at: string
          description: string | null
          focus_areas: string[] | null
          goals: string[] | null
          id: string
          order_index: number | null
          program_id: string
          title: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          order_index?: number | null
          program_id: string
          title: string
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string | null
          focus_areas?: string[] | null
          goals?: string[] | null
          id?: string
          order_index?: number | null
          program_id?: string
          title?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_program_weeks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          age_group: string
          created_at: string
          description: string | null
          difficulty_level: string
          duration_weeks: number
          id: string
          image_url: string | null
          is_published: boolean | null
          max_age_weeks: number | null
          min_age_weeks: number | null
          name: string
          order_index: number | null
          updated_at: string
        }
        Insert: {
          age_group: string
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_weeks: number
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          max_age_weeks?: number | null
          min_age_weeks?: number | null
          name: string
          order_index?: number | null
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string
          duration_weeks?: number
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          max_age_weeks?: number | null
          min_age_weeks?: number | null
          name?: string
          order_index?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          created_at: string
          distraction_level: string | null
          dog_id: string
          dog_trick_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          practice_context: string | null
          progress_status: string | null
          session_date: string
          success_rate_percentage: number | null
          success_rating: number | null
          trick_id: string
        }
        Insert: {
          created_at?: string
          distraction_level?: string | null
          dog_id: string
          dog_trick_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          practice_context?: string | null
          progress_status?: string | null
          session_date?: string
          success_rate_percentage?: number | null
          success_rating?: number | null
          trick_id: string
        }
        Update: {
          created_at?: string
          distraction_level?: string | null
          dog_id?: string
          dog_trick_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          practice_context?: string | null
          progress_status?: string | null
          session_date?: string
          success_rate_percentage?: number | null
          success_rating?: number | null
          trick_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_dog_trick_id_fkey"
            columns: ["dog_trick_id"]
            isOneToOne: false
            referencedRelation: "dog_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      treat_logs: {
        Row: {
          amount: number
          calories: number | null
          created_at: string
          dog_id: string
          given_at: string
          given_by: string | null
          id: string
          notes: string | null
          nutrition_plan_id: string | null
          reason: string | null
          treat_name: string
          treat_type: string
          unit: string
          updated_at: string
        }
        Insert: {
          amount: number
          calories?: number | null
          created_at?: string
          dog_id: string
          given_at?: string
          given_by?: string | null
          id?: string
          notes?: string | null
          nutrition_plan_id?: string | null
          reason?: string | null
          treat_name: string
          treat_type: string
          unit?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          calories?: number | null
          created_at?: string
          dog_id?: string
          given_at?: string
          given_by?: string | null
          id?: string
          notes?: string | null
          nutrition_plan_id?: string | null
          reason?: string | null
          treat_name?: string
          treat_type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treat_logs_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      troubleshooting_modules: {
        Row: {
          brief_description: string | null
          brief_steps: Json | null
          category: string | null
          created_at: string | null
          detailed_description: string | null
          detailed_steps: Json | null
          estimated_time: string | null
          format: string | null
          id: string
          ideal_stage: string | null
          name: string | null
          order_index: string | null
          updated_at: string | null
        }
        Insert: {
          brief_description?: string | null
          brief_steps?: Json | null
          category?: string | null
          created_at?: string | null
          detailed_description?: string | null
          detailed_steps?: Json | null
          estimated_time?: string | null
          format?: string | null
          id?: string
          ideal_stage?: string | null
          name?: string | null
          order_index?: string | null
          updated_at?: string | null
        }
        Update: {
          brief_description?: string | null
          brief_steps?: Json | null
          category?: string | null
          created_at?: string | null
          detailed_description?: string | null
          detailed_steps?: Json | null
          estimated_time?: string | null
          format?: string | null
          id?: string
          ideal_stage?: string | null
          name?: string | null
          order_index?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_breed_recommendations: {
        Row: {
          breed_name: string
          considerations: string
          created_at: string | null
          id: string
          lifestyle_profile_id: string
          match_score: number
          rank: number
          reasoning: string
          shortlisted: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breed_name: string
          considerations: string
          created_at?: string | null
          id?: string
          lifestyle_profile_id: string
          match_score: number
          rank: number
          reasoning: string
          shortlisted?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breed_name?: string
          considerations?: string
          created_at?: string | null
          id?: string
          lifestyle_profile_id?: string
          match_score?: number
          rank?: number
          reasoning?: string
          shortlisted?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_breed_recommendations_lifestyle_profile_id_fkey"
            columns: ["lifestyle_profile_id"]
            isOneToOne: false
            referencedRelation: "lifestyle_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_completions: {
        Row: {
          completed_at: string
          created_at: string
          dog_id: string | null
          id: string
          lesson_id: string
          notes: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          dog_id?: string | null
          id?: string
          lesson_id: string
          notes?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          dog_id?: string | null
          id?: string
          lesson_id?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_completions_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_program_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_completions: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          module_id: string
          notes: string | null
          rating: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          rating?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "foundation_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          best_score_pct: number | null
          completed_at: string | null
          completed_lessons: Json
          created_at: string
          id: string
          mastered: boolean
          module_id: string
          quiz_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score_pct?: number | null
          completed_at?: string | null
          completed_lessons?: Json
          created_at?: string
          id?: string
          mastered?: boolean
          module_id: string
          quiz_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score_pct?: number | null
          completed_at?: string | null
          completed_lessons?: Json
          created_at?: string
          id?: string
          mastered?: boolean
          module_id?: string
          quiz_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_week: number | null
          dog_id: string | null
          id: string
          program_id: string
          started_at: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_week?: number | null
          dog_id?: string | null
          id?: string
          program_id: string
          started_at?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_week?: number | null
          dog_id?: string | null
          id?: string
          program_id?: string
          started_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_records: {
        Row: {
          administered_date: string
          batch_number: string | null
          created_at: string
          dog_id: string
          due_date: string | null
          id: string
          notes: string | null
          updated_at: string
          vaccine_id: string
          vet_clinic_id: string | null
          veterinarian: string | null
        }
        Insert: {
          administered_date: string
          batch_number?: string | null
          created_at?: string
          dog_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          vaccine_id: string
          vet_clinic_id?: string | null
          veterinarian?: string | null
        }
        Update: {
          administered_date?: string
          batch_number?: string | null
          created_at?: string
          dog_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          vaccine_id?: string
          vet_clinic_id?: string | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_vet_clinic_id_fkey"
            columns: ["vet_clinic_id"]
            isOneToOne: false
            referencedRelation: "vet_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          booster_required: boolean | null
          created_at: string
          frequency_months: number | null
          id: string
          lifestyle_factors: string[] | null
          name: string
          notes: string | null
          protects_against: string
          puppy_start_weeks: number | null
          schedule_info: string
          updated_at: string
          vaccine_type: string
        }
        Insert: {
          booster_required?: boolean | null
          created_at?: string
          frequency_months?: number | null
          id?: string
          lifestyle_factors?: string[] | null
          name: string
          notes?: string | null
          protects_against: string
          puppy_start_weeks?: number | null
          schedule_info: string
          updated_at?: string
          vaccine_type: string
        }
        Update: {
          booster_required?: boolean | null
          created_at?: string
          frequency_months?: number | null
          id?: string
          lifestyle_factors?: string[] | null
          name?: string
          notes?: string | null
          protects_against?: string
          puppy_start_weeks?: number | null
          schedule_info?: string
          updated_at?: string
          vaccine_type?: string
        }
        Relationships: []
      }
      vet_clinics: {
        Row: {
          address: string
          business_status: string | null
          created_at: string
          email: string | null
          google_place_id: string | null
          google_types: string[] | null
          hours: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: string | null
          phone: string | null
          rating: number | null
          services: string[] | null
          updated_at: string
          user_ratings_total: number | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address: string
          business_status?: string | null
          created_at?: string
          email?: string | null
          google_place_id?: string | null
          google_types?: string[] | null
          hours?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
          updated_at?: string
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string
          business_status?: string | null
          created_at?: string
          email?: string | null
          google_place_id?: string | null
          google_types?: string[] | null
          hours?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
          updated_at?: string
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      vet_search_analytics: {
        Row: {
          created_at: string
          database_results_count: number | null
          error_message: string | null
          id: string
          osm_results_count: number | null
          response_time_ms: number | null
          search_query: string
          selected_clinic_id: string | null
          total_results_count: number | null
          user_id: string | null
          user_location_provided: boolean | null
        }
        Insert: {
          created_at?: string
          database_results_count?: number | null
          error_message?: string | null
          id?: string
          osm_results_count?: number | null
          response_time_ms?: number | null
          search_query: string
          selected_clinic_id?: string | null
          total_results_count?: number | null
          user_id?: string | null
          user_location_provided?: boolean | null
        }
        Update: {
          created_at?: string
          database_results_count?: number | null
          error_message?: string | null
          id?: string
          osm_results_count?: number | null
          response_time_ms?: number | null
          search_query?: string
          selected_clinic_id?: string | null
          total_results_count?: number | null
          user_id?: string | null
          user_location_provided?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_search_analytics_selected_clinic_id_fkey"
            columns: ["selected_clinic_id"]
            isOneToOne: false
            referencedRelation: "vet_clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      walkers: {
        Row: {
          availability: string | null
          business_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          rating: number | null
          service_area: string | null
          services: string[] | null
          updated_at: string | null
          user_ratings_total: number | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          availability?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rating?: number | null
          service_area?: string | null
          services?: string[] | null
          updated_at?: string | null
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          availability?: string | null
          business_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rating?: number | null
          service_area?: string | null
          services?: string[] | null
          updated_at?: string | null
          user_ratings_total?: number | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      weight_records: {
        Row: {
          created_at: string
          date: string
          dog_id: string
          id: string
          notes: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          dog_id: string
          id?: string
          notes?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          dog_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          max_attempts?: number
          operation_name: string
          time_window_minutes?: number
        }
        Returns: boolean
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; key_name?: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; key_name?: string }
        Returns: string
      }
      exec_sql: { Args: { sql_query: string }; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      get_accessible_vet_clinics: {
        Args: { include_contact_info?: boolean; search_query?: string }
        Returns: {
          address: string
          created_at: string
          email: string
          has_contact_access: boolean
          hours: Json
          id: string
          latitude: number
          longitude: number
          name: string
          osm_place_id: string
          osm_type: string
          phone: string
          services: string[]
          updated_at: string
          verified: boolean
          website: string
        }[]
      }
      get_user_invitations: {
        Args: never
        Returns: {
          accepted_at: string
          created_at: string
          email: string
          expires_at: string
          family_id: string
          id: string
          invited_by: string
          role: string
        }[]
      }
      get_user_profile_secure: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_family_admin: {
        Args: { p_family_id: string; p_user_id: string }
        Returns: boolean
      }
      is_family_member: {
        Args: { p_family_id: string; p_user_id: string }
        Returns: boolean
      }
      mask_email: { Args: { email: string }; Returns: string }
      secure_vet_search: {
        Args: { search_term: string }
        Returns: {
          address: string
          business_status: string | null
          created_at: string
          email: string | null
          google_place_id: string | null
          google_types: string[] | null
          hours: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: string | null
          phone: string | null
          rating: number | null
          services: string[] | null
          updated_at: string
          user_ratings_total: number | null
          verified: boolean | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vet_clinics"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_invitation_token: {
        Args: { _token: string }
        Returns: {
          accepted_at: string
          email: string
          expires_at: string
          family_id: string
          invitation_id: string
          role: string
        }[]
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
