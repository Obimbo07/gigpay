export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          full_name: string | null
          avatar_url: string | null
          country_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          full_name?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kyc: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'under_review' | 'verified' | 'rejected'
          document_type: 'passport' | 'national_id' | 'military_id'
          document_url: string
          selfie_url: string
          submitted_at: string
          verified_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'under_review' | 'verified' | 'rejected'
          document_type: 'passport' | 'national_id' | 'military_id'
          document_url: string
          selfie_url: string
          submitted_at?: string
          verified_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'under_review' | 'verified' | 'rejected'
          document_type?: 'passport' | 'national_id' | 'military_id'
          document_url?: string
          selfie_url?: string
          submitted_at?: string
          verified_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      kyc_status: 'pending' | 'under_review' | 'verified' | 'rejected'
      document_type: 'passport' | 'national_id' | 'military_id'
    }
  }
}
