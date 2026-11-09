'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [identityRevision, setIdentityRevision] = useState(0);
  const authRevision = useRef(0);
  const authIdentity = useRef<string | undefined>(undefined);

  const isConfigured = isSupabaseConfigured();
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authChanged = false;

    // Keep this callback synchronous: SDK calls here can deadlock auth's lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!active) return;
        authChanged = true;
        if (authIdentity.current !== nextSession?.user.id) authRevision.current++;
        authIdentity.current = nextSession?.user.id;
        setIdentityRevision(authRevision.current);
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setProfile(current => current?.id === nextSession?.user.id ? current : null);
        setIsLoading(false);
        if (event === 'SIGNED_IN') setShowAuthModal(null);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const revision = authRevision.current;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        // An auth event is newer than this initial session read.
        if (active && !authChanged && revision === authRevision.current) {
          if (authIdentity.current !== session?.user.id) authRevision.current++;
          authIdentity.current = session?.user.id;
          setIdentityRevision(authRevision.current);
          setSession(session);
          setUser(session?.user ?? null);
          setProfile(current => current?.id === session?.user.id ? current : null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const userId = user?.id;
  useEffect(() => {
    if (!supabase || !userId || authIdentity.current !== userId) return;
    const controller = new AbortController();
    const revision = authRevision.current;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*')
          .eq('id', userId).abortSignal(controller.signal).maybeSingle();
        if (controller.signal.aborted || revision !== authRevision.current) return;
        if (error) throw error;
        setProfile(data as Profile | null);
      } catch (error) {
        if (!controller.signal.aborted && revision === authRevision.current) {
          setProfile(null);
          console.error('Error fetching profile:', error);
        }
      }
    };
    void fetchProfile();
    return () => controller.abort();
  }, [supabase, userId, identityRevision]);

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
    const revision = authRevision.current;
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
    }
    // A newer auth event owns the state, including a sign-in during sign-out.
    if (revision !== authRevision.current) return;
    authRevision.current++;
    authIdentity.current = undefined;
    setIdentityRevision(authRevision.current);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: profile?.id === userId ? profile : null,
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
