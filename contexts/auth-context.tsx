import { supabase } from '@/lib/supabase';
import { Profile, SignInData, SignUpData } from '@/types';
import { formatPhoneToE164, normalizePhoneNumber } from '@/utils/phone-validation';
import { Session, User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (data: SignInData) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  pendingProfileData: Partial<Profile> | null;
  setPendingProfileData: (data: Partial<Profile> | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  pendingProfileData: null,
  setPendingProfileData: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProfileData, setPendingProfileData] = useState<Partial<Profile> | null>(null);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Create profile on first signup
  const createProfile = async (userId: string, data: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await fetchProfile(userId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Try to fetch existing profile
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (existingProfile) {
            setProfile(existingProfile);
          } else if (pendingProfileData) {
            // Create profile if we have pending data (from signup)
            await createProfile(session.user.id, pendingProfileData);
            setPendingProfileData(null);
          } else {
            // Fetch or create profile
            await fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email or phone
  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    try {
      const { method, email, phone, password, fullName, countryCode } = data;

      let authData: any = { 
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation link
        },
      };

      if (method === 'email' && email) {
        authData.email = email.toLowerCase().trim();
        // Use email OTP instead of magic link
        authData.options.shouldCreateUser = true;
      } else if (method === 'phone' && phone && countryCode) {
        // Format phone to E.164
        const e164Phone = formatPhoneToE164(phone, countryCode);
        authData.phone = normalizePhoneNumber(e164Phone);
      } else {
        return { error: new Error('Invalid signup data') };
      }

      // Sign up user - this will send an OTP code to email
      const { data: authResult, error: signUpError } = await supabase.auth.signUp(authData);

      if (signUpError) return { error: signUpError };

      // Store profile data to be created after email verification
      if (authResult.user) {
        setPendingProfileData({
          email: email?.toLowerCase().trim() || null,
          phone: authData.phone || null,
          full_name: fullName || null,
          country_code: countryCode || null,
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with email or phone
  const signIn = async (data: SignInData): Promise<{ error: Error | null }> => {
    try {
      const { method, email, phone, password } = data;

      let authData: any = { password };

      if (method === 'email' && email) {
        authData.email = email.toLowerCase().trim();
      } else if (method === 'phone' && phone) {
        // Assume phone is already in E.164 format from input
        authData.phone = normalizePhoneNumber(phone);
      } else {
        return { error: new Error('Invalid signin data') };
      }

      const { error } = await supabase.auth.signInWithPassword(authData);

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'gigchain',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });

      if (error) return { error };

      // On native, open browser for OAuth
      if (Platform.OS !== 'web' && data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          // Extract tokens from callback URL
          const { data: sessionData, error: sessionError } = 
            await supabase.auth.getSessionFromUrl({ url: result.url });

          if (sessionError) return { error: sessionError };

          // Create profile if needed
          if (sessionData.session?.user) {
            const userId = sessionData.session.user.id;
            const existingProfile = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (!existingProfile.data) {
              await createProfile(userId, {
                email: sessionData.session.user.email || null,
                full_name: sessionData.session.user.user_metadata?.full_name || null,
                avatar_url: sessionData.session.user.user_metadata?.avatar_url || null,
              });
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Refresh profile manually
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    pendingProfileData,
    setPendingProfileData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
