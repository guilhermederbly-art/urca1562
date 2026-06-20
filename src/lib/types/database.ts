export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string }
        Insert: { id: string; username: string; created_at?: string }
        Update: { username?: string }
        Relationships: []
      }
      drivers: {
        Row: {
          id: string; name: string; abbreviation: string
          team: string; number: number; is_bortoleto: boolean
        }
        Insert: { name: string; abbreviation: string; team: string; number: number; is_bortoleto?: boolean; id?: string }
        Update: { name?: string; abbreviation?: string; team?: string; number?: number; is_bortoleto?: boolean }
        Relationships: []
      }
      races: {
        Row: {
          id: string; round_number: number; name: string; circuit: string
          country: string; qualifying_start_time: string; race_start_time: string
          random_position: number | null; openf1_quali_session_key: number | null
          openf1_race_session_key: number | null
          status: 'upcoming' | 'open' | 'closed' | 'finished'; created_at: string
        }
        Insert: {
          round_number: number; name: string; circuit: string; country: string
          qualifying_start_time: string; race_start_time: string
          random_position?: number | null; openf1_quali_session_key?: number | null
          openf1_race_session_key?: number | null; status?: 'upcoming' | 'open' | 'closed' | 'finished'
          id?: string; created_at?: string
        }
        Update: {
          round_number?: number; name?: string; circuit?: string; country?: string
          qualifying_start_time?: string; race_start_time?: string
          random_position?: number | null; openf1_quali_session_key?: number | null
          openf1_race_session_key?: number | null; status?: 'upcoming' | 'open' | 'closed' | 'finished'
        }
        Relationships: []
      }
      race_results: {
        Row: {
          id: string; race_id: string
          pole_driver_id: string | null; p1_driver_id: string | null
          p2_driver_id: string | null; p3_driver_id: string | null
          random_pos_driver_id: string | null; bortoleto_position: number | null
          created_at: string; updated_at: string
        }
        Insert: {
          race_id: string
          pole_driver_id?: string | null; p1_driver_id?: string | null
          p2_driver_id?: string | null; p3_driver_id?: string | null
          random_pos_driver_id?: string | null; bortoleto_position?: number | null
          id?: string; created_at?: string; updated_at?: string
        }
        Update: {
          pole_driver_id?: string | null; p1_driver_id?: string | null
          p2_driver_id?: string | null; p3_driver_id?: string | null
          random_pos_driver_id?: string | null; bortoleto_position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string; user_id: string; race_id: string
          pole_driver_id: string | null; p1_driver_id: string | null
          p2_driver_id: string | null; p3_driver_id: string | null
          random_pos_driver_id: string | null; bortoleto_position: number | null
          created_at: string; updated_at: string
        }
        Insert: {
          user_id: string; race_id: string
          pole_driver_id?: string | null; p1_driver_id?: string | null
          p2_driver_id?: string | null; p3_driver_id?: string | null
          random_pos_driver_id?: string | null; bortoleto_position?: number | null
          id?: string; created_at?: string; updated_at?: string
        }
        Update: {
          pole_driver_id?: string | null; p1_driver_id?: string | null
          p2_driver_id?: string | null; p3_driver_id?: string | null
          random_pos_driver_id?: string | null; bortoleto_position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          id: string; user_id: string; race_id: string
          pole_points: number; p1_points: number; p2_points: number
          p3_points: number; random_pos_points: number; bortoleto_points: number
          total_points: number
        }
        Insert: {
          user_id: string; race_id: string
          pole_points?: number; p1_points?: number; p2_points?: number
          p3_points?: number; random_pos_points?: number; bortoleto_points?: number
          total_points?: number; id?: string
        }
        Update: {
          pole_points?: number; p1_points?: number; p2_points?: number
          p3_points?: number; random_pos_points?: number; bortoleto_points?: number
          total_points?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Driver = Database['public']['Tables']['drivers']['Row']
export type Race = Database['public']['Tables']['races']['Row']
export type RaceResult = Database['public']['Tables']['race_results']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type Score = Database['public']['Tables']['scores']['Row']
