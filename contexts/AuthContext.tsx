'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User, Session, Provider } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/types';

type OAuthProvider = Extract<Provider, 'google' | 'apple' | 'twitter'>;

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  showAuthModal: 'signin' | 'signup' | null;
  setShowAuthModal: (modal: 'signin' | 'signup' | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);

  const isConfigured = isSupabaseConfigured();
  const supabase = createClient();

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    // If Supabase is not configured, skip auth initialization
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session?.user) {
          setProfile(null);
        } else if (event === 'SIGNED_IN') {
          // Only (re)fetch the profile on an actual sign-in. Token refreshes
          // and user-metadata updates keep the profile we already have.
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
          setShowAuthModal(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }

    // The profile row is created by the `handle_new_user` database trigger
    // (migration 010) using this metadata. We deliberately do NOT insert into
    // `profiles` from the client: with email confirmation enabled signUp
    // returns no session, so a client insert would run unauthenticated and be
    // rejected by RLS. The trigger also covers OAuth signups, which never call
    // this method at all.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          display_name: displayName || undefined,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/`,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/auth/reset`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const resendConfirmation = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        resendConfirmation,
        signOut,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
