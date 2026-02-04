# GigPay Authentication - Quick Setup Checklist

## Pre-requisites
- [ ] Node.js installed (v20+)
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] Supabase account created
- [ ] Google Cloud Console account (for OAuth)

## 1. Supabase Setup

### Create Project
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Note down Project URL and Anon Key

### Configure Environment
- [ ] Copy `.env.example` to `.env.development`
- [ ] Add `EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
- [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`

### Run Database Schema
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `supabase/schema.sql`
- [ ] Paste and run SQL
- [ ] Verify tables created: `profiles`, `kyc`
- [ ] Verify storage buckets created: `kyc-documents`, `kyc-selfies`

### Configure Auth Providers

#### Email Provider
- [ ] Go to Authentication → Providers → Email
- [ ] Enable Email provider
- [ ] **Enable** "Confirm email"
- [ ] Save changes

#### Phone Provider
- [ ] Go to Authentication → Providers → Phone
- [ ] Enable Phone provider
- [ ] **DISABLE** "Confirm phone" ⚠️ (Important!)
- [ ] Save changes

#### Google OAuth
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project or select existing
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials:
  - Application type: Web application
  - Authorized redirect URIs:
    - `https://your-project.supabase.co/auth/v1/callback`
    - `gigchain://auth/callback`
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] In Supabase Dashboard → Authentication → Providers → Google:
  - Enable Google provider
  - Paste Client ID
  - Paste Client Secret
  - Save changes

### URL Configuration
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL (your production URL)
- [ ] Add Redirect URLs:
  - `gigchain://auth/callback`
  - `exp://localhost:8081`
  - `http://localhost:19006` (for web)

### Verify Storage Setup
- [ ] Go to Storage → Buckets
- [ ] Verify `kyc-documents` bucket exists (5MB limit)
- [ ] Verify `kyc-selfies` bucket exists (2MB limit)
- [ ] Check Policies tab → verify RLS policies are active

## 2. Local Development Setup

### Install Dependencies
```bash
cd /home/lulwanda/Downloads/gigpay
# Already installed, but if needed:
# npm install
```

### Update App Configuration
- [ ] Open `app.json`
- [ ] Verify `scheme: "gigchain"` is set
- [ ] Verify `ios.bundleIdentifier: "com.gigchain.app"`
- [ ] Verify `android.package: "com.gigchain.app"`

### Start Development Server
```bash
npm start
```

## 3. Testing

### Test Email Auth
- [ ] Run app on simulator/emulator
- [ ] Navigate to Sign Up
- [ ] Select "Email" tab
- [ ] Enter: name, email, password
- [ ] Click "Sign Up"
- [ ] Check email for verification link
- [ ] Click link → email verified
- [ ] Go back to app → Log In
- [ ] Enter email + password
- [ ] Should redirect to home screen
- [ ] Close and reopen app → should stay logged in

### Test Phone Auth
- [ ] Sign Out
- [ ] Navigate to Sign Up
- [ ] Select "Phone" tab
- [ ] Enter: name, phone (+254...), password
- [ ] Click "Sign Up"
- [ ] Should immediately redirect to home (auto-confirmed)
- [ ] Sign Out → Log In with phone
- [ ] Should work without any SMS verification

### Test Google OAuth
- [ ] Sign Out
- [ ] Click "Continue with Google"
- [ ] Browser/WebView should open
- [ ] Authenticate with Google account
- [ ] Should redirect back to app
- [ ] Should be logged in and see home screen

### Test KYC Flow
- [ ] Go to Profile tab
- [ ] Click "Start Verification"
- [ ] Select "National ID"
- [ ] Upload or take photo of document
- [ ] Take selfie
- [ ] Review → Submit
- [ ] Check Supabase Storage:
  - Go to Storage → kyc-documents → verify file uploaded
  - Go to Storage → kyc-selfies → verify file uploaded
- [ ] Check Database:
  - Go to Table Editor → kyc → verify record with status='pending'
- [ ] Refresh profile → should show "Pending Review" badge

### Test Navigation Guards
- [ ] Sign Out → should redirect to login
- [ ] Try to access /(tabs) route manually → should redirect to login
- [ ] Log In → should redirect to home
- [ ] Try to access /(auth)/login → should redirect to tabs

### Test Session Persistence
- [ ] Log In
- [ ] Close app completely
- [ ] Reopen app
- [ ] Should still be logged in (no redirect to login)
- [ ] Verify on iOS, Android, and Web

## 4. Multi-Platform Testing

### iOS
```bash
npm run ios
```
- [ ] Email auth works
- [ ] Phone auth works
- [ ] Google OAuth works (redirects properly)
- [ ] KYC upload works (camera permissions)
- [ ] Session persists (SecureStore)

### Android
```bash
npm run android
```
- [ ] Email auth works
- [ ] Phone auth works
- [ ] Google OAuth works
- [ ] KYC upload works
- [ ] Session persists

### Web
```bash
npm run web
```
- [ ] Email auth works
- [ ] Phone auth works
- [ ] Google OAuth works (popup)
- [ ] KYC upload works (file picker)
- [ ] Session persists (localStorage)

## 5. Production Checklist

### Environment Variables
- [ ] Create `.env.production` with production Supabase credentials
- [ ] Create `.env.staging` with staging credentials
- [ ] Add env files to `.gitignore` (already done)
- [ ] Store secrets in CI/CD or EAS Secrets

### Google OAuth Production
- [ ] Add production OAuth credentials in Google Console
- [ ] Add production redirect URIs
- [ ] Update Supabase with production Google credentials

### App Configuration
- [ ] Update `scheme` in app.json for production
- [ ] Set production bundle identifiers
- [ ] Configure deep linking for production URLs

### Supabase Production
- [ ] Run schema.sql on production database
- [ ] Configure auth providers
- [ ] Set production URL configuration
- [ ] Test all auth flows on production

### App Store / Play Store
- [ ] Configure associated domains (iOS)
- [ ] Configure app links (Android)
- [ ] Test deep links from email verification
- [ ] Test OAuth redirects

## 6. Known Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution**: 
- Restart Metro bundler: `npm start -- --reset-cache`
- Verify `.env.development` exists
- Check env vars are prefixed with `EXPO_PUBLIC_`

### Issue: OAuth redirect doesn't work on native
**Solution**:
- Verify `scheme: "gigchain"` in app.json
- Test deep link: `npx uri-scheme open gigchain://auth/callback --ios`
- Check Google Console redirect URIs match exactly

### Issue: Phone signup returns "Invalid phone number"
**Solution**:
- Ensure "Confirm phone" is **disabled** in Supabase
- Check phone is in E.164 format (+254...)
- Verify `formatPhoneToE164()` is working correctly

### Issue: KYC image upload fails
**Solution**:
- Check file size < 5MB (documents) or < 2MB (selfies)
- Verify storage buckets exist
- Check RLS policies are applied
- Test with smaller image first

### Issue: Session doesn't persist after app restart
**Solution**:
- iOS: Check SecureStore permissions
- Android: Check keystore permissions
- Web: Check localStorage is enabled
- Clear app data and retry

## 7. Next Steps After Setup

- [ ] Customize UI/styling to match brand
- [ ] Add loading states and error handling
- [ ] Implement email change flow
- [ ] Add password reset functionality
- [ ] Build admin dashboard for KYC review
- [ ] Integrate with Hedera wallet
- [ ] Add analytics tracking
- [ ] Set up error monitoring (Sentry)
- [ ] Configure push notifications
- [ ] Add biometric authentication

## Support

Need help? Check:
1. `AUTH_SETUP_README.md` - Detailed documentation
2. Supabase Dashboard → Logs - Error logs
3. App console - Runtime errors
4. Supabase Docs - https://supabase.com/docs

## Completion Checklist

- [ ] All dependencies installed
- [ ] Supabase project configured
- [ ] Database schema deployed
- [ ] Auth providers configured (Email, Phone, Google)
- [ ] Storage buckets created with RLS
- [ ] Environment variables set
- [ ] Email auth tested and working
- [ ] Phone auth tested and working
- [ ] Google OAuth tested and working
- [ ] KYC flow tested and working
- [ ] Session persistence verified
- [ ] Multi-platform tested (iOS, Android, Web)

---

**Status**: ⏳ Ready for configuration
**Last Updated**: February 4, 2026
