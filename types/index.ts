import { Database } from './database.types';

// Auth types
export type User = Database['public']['Tables']['profiles']['Row'];
export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
};

// Profile types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// KYC types
export type KYCStatus = 'pending' | 'under_review' | 'verified' | 'rejected';
export type DocumentType = 'passport' | 'national_id' | 'military_id';

export type KYC = Database['public']['Tables']['kyc']['Row'];
export type KYCInsert = Database['public']['Tables']['kyc']['Insert'];
export type KYCUpdate = Database['public']['Tables']['kyc']['Update'];

// Transaction types
export type TransactionType = 'credit' | 'debit' | 'yield' | 'withdrawal' | 'deposit';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Wallet info type
export type WalletInfo = {
  hedera_account_id: string | null;
  hedera_public_key: string | null;
  wallet_created_at: string | null;
  balance: number; // USDC balance
  hbar_balance: number; // HBAR balance
  has_wallet: boolean;
  last_updated?: Date;
};

// Image validation constants
export const IMAGE_VALIDATION = {
  DOCUMENT: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'] as const,
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'] as const,
  },
  SELFIE: {
    MAX_SIZE_MB: 2,
    MAX_SIZE_BYTES: 2 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'] as const,
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'] as const,
  },
} as const;

// Image validation result
export type ImageValidationResult = {
  isValid: boolean;
  error?: string;
  file?: {
    uri: string;
    type: string;
    size: number;
    name: string;
  };
};

// KYC workflow state machine
export type KYCWorkflow = {
  status: KYCStatus;
  canSubmit: boolean;
  canReview: boolean;
  canApprove: boolean;
  canReject: boolean;
  nextStates: KYCStatus[];
};

// KYC workflow transitions
export const KYC_WORKFLOW: Record<KYCStatus, KYCWorkflow> = {
  pending: {
    status: 'pending',
    canSubmit: false,
    canReview: true,
    canApprove: false,
    canReject: false,
    nextStates: ['under_review', 'rejected'],
  },
  under_review: {
    status: 'under_review',
    canSubmit: false,
    canReview: false,
    canApprove: true,
    canReject: true,
    nextStates: ['verified', 'rejected'],
  },
  verified: {
    status: 'verified',
    canSubmit: false,
    canReview: false,
    canApprove: false,
    canReject: false,
    nextStates: [],
  },
  rejected: {
    status: 'rejected',
    canSubmit: true,
    canReview: false,
    canApprove: false,
    canReject: false,
    nextStates: ['pending'],
  },
} as const;

// Phone number validation
export type PhoneNumberData = {
  countryCode: string;
  dialCode: string;
  e164Number: string; // International format: +254712345678
  nationalNumber: string;
  isValid: boolean;
};

// Authentication method type
export type AuthMethod = 'email' | 'phone';

// Sign up data
export type SignUpData = {
  method: AuthMethod;
  email?: string;
  phone?: string;
  password: string;
  fullName?: string;
  countryCode?: string;
};

// Sign in data
export type SignInData = {
  method: AuthMethod;
  email?: string;
  phone?: string;
  password: string;
};
