# GigPay Authentication Setup Guide

Complete Supabase authentication implementation for Expo React Native app with email/phone/password authentication, Google OAuth, KYC verification, and multi-country phone support.

## Features Implemented

✅ **Multi-Method Authentication**
- Email + Password (with email verification)
- Phone + Password (auto-confirmed, no OTP)
- Google OAuth (Web, iOS, Android)

✅ **Session Management**
- Secure token storage (SecureStore on native, localStorage on web)
- Auto-refresh tokens
- Session persistence across app restarts
- Protected routes with navigation guards

✅ **KYC Verification Flow**
- Document upload (Passport, National ID, Military ID)
- Selfie capture for identity verification
- Image validation (file type, size limits)
- Image compression before upload
- Document storage in Supabase Storage
- KYC workflow state machine (pending → under_review → verified/rejected)

✅ **International Phone Support**
- Multi-country phone input with country picker
- E.164 phone number formatting
- Phone number uniqueness validation
- Support for all international dialing codes

✅ **Database Schema**
- Profiles table with RLS (Row Level Security)
- KYC table with status tracking
- Storage buckets with RLS policies
- Automatic profile creation on signup

## Project Structure

```
app/
├── (auth)/
│   ├── _layout.tsx          # Auth stack navigator
│   ├── login.tsx             # Login screen (email/phone + Google)
│   └── signup.tsx            # Signup screen with verification
├── (tabs)/
│   ├── _layout.tsx           # Bottom tabs navigator
│   ├── index.tsx             # Home screen
│   ├── explore.tsx           # Explore screen
│   ├── profile.tsx           # Profile & KYC status screen
│   └── kyc-verification.tsx  # KYC document upload flow
└── _layout.tsx               # Root layout with auth guards

contexts/
└── auth-context.tsx          # Auth provider with session management

lib/
└── supabase.ts               # Supabase client configuration

utils/
├── storage.ts                # Cross-platform storage adapter
├── image-validation.ts       # KYC image validation & compression
└── phone-validation.ts       # Phone number formatting (E.164)

types/
├── index.ts                  # App types & constants
└── database.types.ts         # Supabase database types

supabase/
└── schema.sql                # Complete database schema & RLS policies
```

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
- `@supabase/supabase-js` - Supabase client
- `react-native-url-polyfill` - URL polyfill for React Native
- `@react-native-async-storage/async-storage` - AsyncStorage
- `expo-secure-store` - Secure storage for tokens
- `expo-auth-session` - OAuth flow handling
- `expo-crypto` - Cryptographic functions
- `react-native-phone-number-input` - International phone input
- `expo-image-picker` - Camera & gallery access
- `expo-document-picker` - Document picker
- `expo-image-manipulator` - Image compression

### 2. Configure Environment Variables

Update `.env.development`, `.env.staging`, and `.env.production` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_ENV=development
```

Get these from your Supabase Dashboard → Settings → API

### 3. Set Up Supabase Database

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run the SQL to create:
   - `profiles` and `kyc` tables
   - Enums for `kyc_status` and `document_type`
   - Row Level Security (RLS) policies
   - Storage buckets (`kyc-documents`, `kyc-selfies`)
   - Triggers for auto-profile creation
   - Helper functions

### 4. Configure Supabase Dashboard

#### Email Provider
1. Go to Authentication → Providers → Email
2. ✅ Enable Email provider
3. ✅ Enable "Confirm email" (users get verification link)
4. Set email templates (optional)

#### Phone Provider
1. Go to Authentication → Providers → Phone
2. ✅ Enable Phone provider
3. ❌ **DISABLE** "Confirm phone" (auto-confirms phone signups without SMS)
4. This allows phone/password auth without OTP

#### Google OAuth
1. Create OAuth 2.0 Client IDs in [Google Cloud Console](https://console.cloud.google.com/):
   - **Web**: Add `https://your-project.supabase.co/auth/v1/callback`
   - **iOS**: Add `gigchain://auth/callback` (bundle ID: `com.gigchain.app`)
   - **Android**: Add `gigchain://auth/callback` (package: `com.gigchain.app`)

2. In Supabase Dashboard → Authentication → Providers → Google:
   - ✅ Enable Google provider
   - Add **Client ID** (Web)
   - Add **Client Secret**
   - Add additional Client IDs for iOS/Android if needed

#### URL Configuration
1. Go to Authentication → URL Configuration
2. **Site URL**: Your production URL
3. **Redirect URLs**: Add:
   - `gigchain://auth/callback`
   - `exp://localhost:8081` (for Expo dev)
   - Your production deep link URLs

### 5. Storage Buckets (Auto-created by SQL)

The SQL schema creates two storage buckets:
- `kyc-documents`: 5MB limit, allows JPG/PNG/PDF
- `kyc-selfies`: 2MB limit, allows JPG/PNG

Verify in Dashboard → Storage that buckets exist and RLS policies are applied.

### 6. Test the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Authentication Flow

### Email Signup Flow
1. User enters email + password
2. `supabase.auth.signUp()` creates auth user
3. Supabase sends verification email
4. User clicks link to verify email
5. Profile auto-created via database trigger
6. User can log in after verification

### Phone Signup Flow
1. User selects country code + enters phone number
2. Phone formatted to E.164 format (+254712345678)
3. `supabase.auth.signUp()` with phone + password
4. Phone is **auto-confirmed** (no SMS sent)
5. Profile auto-created
6. User redirected to home immediately

### Google OAuth Flow
1. User clicks "Continue with Google"
2. `signInWithOAuth()` opens browser/WebView
3. User authenticates with Google
4. OAuth callback redirects to `gigchain://auth/callback`
5. Session tokens extracted and stored
6. Profile created if first login
7. User redirected to home

### Login Flow
1. User enters email/phone + password
2. `supabase.auth.signInWithPassword()`
3. Session stored in SecureStore/localStorage
4. Auto-redirected to tabs if authenticated
5. Session persists across app restarts

## KYC Verification Flow

### User Flow
1. Navigate to Profile tab
2. Click "Start Verification"
3. Select document type (Passport/National ID/Military ID)
4. Upload/capture document photo
5. Take selfie
6. Review and submit
7. Documents uploaded to Supabase Storage
8. KYC record created with status = 'pending'

### KYC Workflow States
- **null/undefined**: Not started → Show "Start Verification" button
- **pending**: Submitted, waiting for review → Show status badge
- **under_review**: Admin reviewing → Show "Under Review" badge
- **verified**: Approved ✓ → Show "Verified" badge with checkmark
- **rejected**: Rejected with reason → Show reason + "Resubmit" button

### Admin Review (Future Implementation)
Admin dashboard (separate repo) will:
1. Query KYC records with status = 'pending'
2. Display document images from Storage
3. Update status to 'under_review', 'verified', or 'rejected'
4. Add `rejection_reason` if rejected
5. Set `reviewed_by` and `reviewed_at` timestamps

## Image Validation

### Document Upload
- **Max size**: 5MB
- **Allowed types**: JPEG, PNG, PDF
- **Compression**: Images compressed to max 1920px width at 80% quality

### Selfie Upload
- **Max size**: 2MB
- **Allowed types**: JPEG, PNG
- **Compression**: Images compressed to max 1280px width at 70% quality

## Phone Number Format

All phone numbers stored in **E.164 format**: `+[country code][number]`

Examples:
- Kenya: `+254712345678`
- USA: `+14155552671`
- Canada: `+16135551234`
- UK: `+447700900123`

The `react-native-phone-number-input` component handles:
- Country picker with flags
- Auto-formatting based on country
- Validation of number length
- Extraction of country/dial codes

## Security Features

✅ **Row Level Security (RLS)**
- Users can only access their own profiles
- Users can only view/create their own KYC records
- Storage policies ensure users only access their own files

✅ **Secure Token Storage**
- Native: `expo-secure-store` (encrypted keychain/keystore)
- Web: `localStorage` with Supabase's built-in security

✅ **Phone Number Uniqueness**
- Database constraint ensures one account per phone
- Stored in normalized E.164 format

✅ **Image Validation**
- File type checking (MIME + extension)
- File size limits enforced
- Compression before upload to reduce bandwidth

## Navigation Guards

The root layout (`app/_layout.tsx`) implements auth guards:
- **Unauthenticated**: Redirect to `/(auth)/login`
- **Authenticated**: Redirect to `/(tabs)` home
- **Loading**: Show nothing until session checked

## Testing Checklist

### Email Auth
- [ ] Sign up with email → receive verification email
- [ ] Click verification link → email confirmed
- [ ] Log in with verified email → access home
- [ ] Log out → redirected to login
- [ ] Close app → reopen → still logged in (session persisted)

### Phone Auth
- [ ] Sign up with phone (Kenya +254) → auto-confirmed
- [ ] Log in with phone → access home immediately
- [ ] Test multiple countries (US, Canada, UK)
- [ ] Verify E.164 format in database

### Google OAuth
- [ ] Click "Continue with Google" → browser opens
- [ ] Authenticate → redirected back to app
- [ ] Profile created with email from Google
- [ ] Log out → log in again → profile exists

### KYC Flow
- [ ] Upload passport → document stored
- [ ] Take selfie → selfie stored
- [ ] Submit → status = 'pending'
- [ ] Refresh profile → KYC status displayed
- [ ] Verify files in Supabase Storage buckets

### Cross-Platform
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on web browser
- [ ] Session persists across all platforms

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.development` exists with correct values
- Restart Metro bundler: `npm start -- --reset-cache`

### OAuth redirect not working
- Check `scheme: "gigchain"` in `app.json`
- Verify redirect URL in Google Console matches `gigchain://auth/callback`
- Test deep link: `npx uri-scheme open gigchain://auth/callback --ios`

### Image upload fails
- Check Storage bucket exists: `kyc-documents`, `kyc-selfies`
- Verify RLS policies are applied
- Check file size < limits (5MB/2MB)

### Phone auth not working
- Ensure "Confirm phone" is **disabled** in Supabase Dashboard
- Check phone is in E.164 format (+254...)
- Verify uniqueness constraint in database

### Session not persisting
- Check `expo-secure-store` permissions (iOS Keychain, Android Keystore)
- Test storage manually: `SecureStore.setItemAsync('test', 'value')`
- Clear app data and retry

## Next Steps

### Immediate
1. Add your Supabase credentials to `.env` files
2. Run SQL schema in Supabase Dashboard
3. Configure auth providers (Email, Phone, Google)
4. Test signup/login flows

### Future Enhancements
1. **Admin Dashboard** (separate repo):
   - KYC review interface
   - Approve/reject documents
   - Bulk verification tools

2. **Enhanced KYC**:
   - OCR for document parsing
   - Face matching (selfie vs document photo)
   - Liveness detection (blink, turn head)
   - Integration with third-party KYC providers (Persona, Onfido, Smile ID)

3. **Additional Auth Methods**:
   - Biometric authentication (Face ID, Fingerprint)
   - Two-factor authentication (2FA)
   - Magic links (passwordless email)

4. **Profile Enhancements**:
   - Avatar upload
   - Edit profile information
   - Change password flow
   - Email/phone change with re-verification

5. **Hedera Integration**:
   - Link Hedera wallet to profile
   - Store wallet public key
   - Sign transactions in-app

## Support

For issues or questions:
1. Check Supabase Dashboard → Logs for errors
2. Check app console logs
3. Review RLS policies in database
4. Test with fresh Supabase project if issues persist

## License

MIT
