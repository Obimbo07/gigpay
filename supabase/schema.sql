-- GigPay Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- KYC Status Enum
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');

-- Document Type Enum
CREATE TYPE document_type AS ENUM ('passport', 'national_id', 'military_id');

-- ============================================
-- TABLES
-- ============================================

-- Profiles Table
-- Stores user profile information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    country_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on phone and email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Add unique constraint for phone (E.164 format)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_check 
    CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');

-- KYC Table
-- Stores KYC verification data with document references
CREATE TABLE IF NOT EXISTS public.kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status kyc_status DEFAULT 'pending',
    document_type document_type NOT NULL,
    document_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for KYC queries
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submitted_at ON public.kyc(submitted_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- KYC RLS Policies
-- Users can view their own KYC records
CREATE POLICY "Users can view own KYC records"
    ON public.kyc FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own KYC records
CREATE POLICY "Users can insert own KYC records"
    ON public.kyc FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own KYC records (only if rejected, to resubmit)
CREATE POLICY "Users can update rejected KYC records"
    ON public.kyc FOR UPDATE
    USING (auth.uid() = user_id AND status = 'rejected')
    WITH CHECK (auth.uid() = user_id);

-- Admin policy for KYC review (you'll need to create an admin role separately)
-- CREATE POLICY "Admins can update any KYC record"
--     ON public.kyc FOR UPDATE
--     USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets for KYC documents
-- Run these in the Supabase Storage section or via SQL:

-- KYC Documents Bucket (for IDs, passports, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kyc-documents',
    'kyc-documents',
    false,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- KYC Selfies Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kyc-selfies',
    'kyc-selfies',
    false,
    2097152, -- 2MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- KYC Documents Storage Policies
-- Users can upload their own documents (path format: user_id/filename)
CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own documents (optional, for resubmission)
CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'kyc-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- KYC Selfies Storage Policies
-- Users can upload their own selfies
CREATE POLICY "Users can upload own selfies"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'kyc-selfies' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own selfies
CREATE POLICY "Users can view own selfies"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'kyc-selfies' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own selfies (optional)
CREATE POLICY "Users can delete own selfies"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'kyc-selfies' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for kyc updated_at
CREATE TRIGGER update_kyc_updated_at
    BEFORE UPDATE ON public.kyc
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's KYC status
CREATE OR REPLACE FUNCTION public.get_user_kyc_status(user_uuid UUID)
RETURNS kyc_status AS $$
DECLARE
    kyc_record RECORD;
BEGIN
    SELECT status INTO kyc_record
    FROM public.kyc
    WHERE user_id = user_uuid
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF kyc_record IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN kyc_record.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL DATA / SEED (Optional)
-- ============================================

-- You can add seed data here if needed
-- For example, admin users or test data

-- ============================================
-- NOTES FOR SUPABASE DASHBOARD CONFIGURATION
-- ============================================

/*
IMPORTANT: Configure these settings in your Supabase Dashboard:

1. Authentication -> Providers -> Email
   - Enable Email provider
   - Enable "Confirm email" (sends verification link)
   - Set "Email confirmation redirect" to your app URL

2. Authentication -> Providers -> Phone
   - Enable Phone provider
   - DISABLE "Confirm phone" (auto-confirms phone signups)
   - This allows phone/password auth without SMS OTP

3. Authentication -> Providers -> Google
   - Enable Google provider
   - Add Client ID from Google Cloud Console
   - Add Client Secret from Google Cloud Console
   - Configure OAuth 2.0 redirect URIs:
     * Web: https://your-project.supabase.co/auth/v1/callback
     * iOS: gigchain://auth/callback
     * Android: gigchain://auth/callback

4. Authentication -> URL Configuration
   - Site URL: Your production URL
   - Redirect URLs: Add your app's deep link scheme (gigchain://)

5. Storage Settings
   - Verify buckets 'kyc-documents' and 'kyc-selfies' are created
   - Check that RLS policies are applied
   - Test file upload permissions

6. Project Settings -> API
   - Copy SUPABASE_URL and SUPABASE_ANON_KEY
   - Add to your .env files (development, staging, production)
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'kyc');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'kyc');

-- Check storage buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('kyc-documents', 'kyc-selfies');

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'kyc');
