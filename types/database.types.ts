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
          hedera_account_id: string | null
          hedera_public_key: string | null
          wallet_created_at: string | null
          usdc_associated: boolean | null
          usdc_prompt_dismissed: boolean | null
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
          hedera_account_id?: string | null
          hedera_public_key?: string | null
          wallet_created_at?: string | null
          usdc_associated?: boolean | null
          usdc_prompt_dismissed?: boolean | null
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
          hedera_account_id?: string | null
          hedera_public_key?: string | null
          wallet_created_at?: string | null
          usdc_associated?: boolean | null
          usdc_prompt_dismissed?: boolean | null
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
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'credit' | 'debit' | 'yield' | 'withdrawal' | 'deposit'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount: number
          currency: string
          title: string
          description: string | null
          counterparty: string | null
          location: string | null
          hedera_tx_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'credit' | 'debit' | 'yield' | 'withdrawal' | 'deposit'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount: number
          currency?: string
          title: string
          description?: string | null
          counterparty?: string | null
          location?: string | null
          hedera_tx_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'credit' | 'debit' | 'yield' | 'withdrawal' | 'deposit'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount?: number
          currency?: string
          title?: string
          description?: string | null
          counterparty?: string | null
          location?: string | null
          hedera_tx_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_balances: {
        Row: {
          user_id: string
          balance: number
          total_transactions: number
          last_activity: string | null
        }
      }
    }
    Functions: {
      get_user_wallet: {
        Args: { user_uuid: string }
        Returns: {
          hedera_account_id: string | null
          hedera_public_key: string | null
          wallet_created_at: string | null
          balance: number
          has_wallet: boolean
        }[]
      }
      get_user_kyc_status: {
        Args: { user_uuid: string }
        Returns: 'pending' | 'under_review' | 'verified' | 'rejected' | null
      }
    }
    Enums: {
      kyc_status: 'pending' | 'under_review' | 'verified' | 'rejected'
      document_type: 'passport' | 'national_id' | 'military_id'
      transaction_type: 'credit' | 'debit' | 'yield' | 'withdrawal' | 'deposit'
      transaction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    }
  }
}
