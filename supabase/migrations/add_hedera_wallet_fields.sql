-- Migration: Add Hedera wallet fields to profiles
-- Run this in Supabase SQL Editor

-- Add Hedera wallet columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hedera_account_id TEXT,
ADD COLUMN IF NOT EXISTS hedera_public_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMPTZ;

-- Add index for Hedera account lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hedera_account_id 
ON public.profiles(hedera_account_id);

-- Add constraint to validate Hedera account ID format (0.0.xxxxx)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_hedera_account_id_check 
CHECK (hedera_account_id IS NULL OR hedera_account_id ~ '^0\.0\.\d+$');

-- ============================================
-- TRANSACTIONS TABLE (for activity history)
-- ============================================

-- Transaction type enum
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'yield', 'withdrawal', 'deposit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transaction status enum  
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transactions table for activity history
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount DECIMAL(20, 6) NOT NULL,
    currency TEXT DEFAULT 'USDC',
    title TEXT NOT NULL,
    description TEXT,
    counterparty TEXT,  -- e.g., "John D.", "M-Pesa 0712***789"
    location TEXT,      -- e.g., "Canada", "Kenya"
    hedera_tx_id TEXT,  -- Hedera transaction ID if applicable
    metadata JSONB,     -- Additional transaction data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WALLET BALANCES VIEW
-- ============================================

-- View to calculate user's current balance from transactions
CREATE OR REPLACE VIEW public.user_balances AS
SELECT 
    user_id,
    SUM(CASE 
        WHEN type IN ('credit', 'deposit', 'yield') AND status = 'completed' THEN amount
        WHEN type IN ('debit', 'withdrawal') AND status = 'completed' THEN -amount
        ELSE 0
    END) as balance,
    COUNT(*) as total_transactions,
    MAX(created_at) as last_activity
FROM public.transactions
GROUP BY user_id;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's wallet info
CREATE OR REPLACE FUNCTION public.get_user_wallet(user_uuid UUID)
RETURNS TABLE (
    hedera_account_id TEXT,
    hedera_public_key TEXT,
    wallet_created_at TIMESTAMPTZ,
    balance DECIMAL,
    has_wallet BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.hedera_account_id,
        p.hedera_public_key,
        p.wallet_created_at,
        COALESCE(b.balance, 0)::DECIMAL as balance,
        (p.hedera_account_id IS NOT NULL) as has_wallet
    FROM public.profiles p
    LEFT JOIN public.user_balances b ON p.id = b.user_id
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
