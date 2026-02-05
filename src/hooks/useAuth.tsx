import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /**
   * UI-ONLY FLAG: This flag is used solely for UI rendering purposes.
   * Actual authorization is enforced server-side via RLS policies and the has_role() function.
   * Do NOT use this flag for security decisions - it can be manipulated client-side.
   */
  showAdminUI: boolean;
  /**
   * UI-ONLY FLAG: Indicates if user has super_admin role for UI rendering.
   * Actual authorization is enforced server-side via RLS policies.
   */
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: Error | null; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // UI-ONLY: Used for conditional rendering, NOT security. Server-side RLS enforces actual access.
  const [showAdminUI, setShowAdminUI] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setShowAdminUI(false);
          setIsSuperAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // UI-ONLY: Fetches admin status for rendering purposes. Actual security is enforced via RLS.
  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        setShowAdminUI(false);
        setIsSuperAdmin(false);
        return;
      }
      
      setShowAdminUI(!!data);
      setIsSuperAdmin(data?.role === 'super_admin');
    } catch (err) {
      console.error('Exception checking admin role:', err);
      setShowAdminUI(false);
      setIsSuperAdmin(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Validate inputs
      if (!email || !email.includes('@')) {
        return { error: new Error('Please enter a valid email address') };
      }
      
      if (!password || password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }
      
      if (!fullName || fullName.trim().length < 2) {
        return { error: new Error('Please enter your full name') };
      }

      // Get current origin for Vite/React
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        // Provide user-friendly error messages
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('password')) {
          message = 'Password is too weak. Please use a stronger password.';
        }
        return { error: new Error(message), message };
      }
      
      // Also create a profile entry
      if (data.user) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      return { error: null, message: 'Registration successful! Please check your email to confirm your account.' };
      
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      return { error: new Error('An unexpected error occurred. Please try again.'), message: 'An unexpected error occurred.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !email.includes('@')) {
        return { error: new Error('Please enter a valid email address') };
      }
      
      if (!password) {
        return { error: new Error('Please enter your password') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        // Provide user-friendly error messages
        let message = error.message;
        if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Please confirm your email address before signing in.';
        } else if (error.message.includes('rate limit')) {
          message = 'Too many attempts. Please try again later.';
        }
        return { error: new Error(message), message };
      }
      
      // Sync profile if needed
      if (data.user) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      return { error: null };
      
    } catch (err) {
      console.error('Unexpected sign in error:', err);
      return { error: new Error('An unexpected error occurred. Please try again.'), message: 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      setShowAdminUI(false);
      setIsSuperAdmin(false);
    } catch (err) {
      console.error('Unexpected sign out error:', err);
    }
  };

  const value = {
    user,
    session,
    loading,
    showAdminUI,
    isSuperAdmin,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
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