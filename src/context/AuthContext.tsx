"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  updated_at: string | null;
  confirmed_at: string | null;
  created_at: string | null;
  avatar_url: string | null;
  last_sign_in_at: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  isAuthDialogOpen: boolean;
  setIsAuthDialogOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);

  // Load user session
  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const u = session.user;
        const newUser = {
          id: u.id,
          name: u.user_metadata?.name || null,
          email: u.email || null,
          role: u.role || null,
          updated_at: u.updated_at || null,
          confirmed_at: u.confirmed_at || null,
          created_at: u.created_at || null,
          avatar_url: u.user_metadata?.avatar_url || null,
          last_sign_in_at: u.last_sign_in_at || null
        };

        setUser(newUser);
        setAccessToken(session.access_token);
        console.log("User", newUser);

      } else {
        setUser(null);
        setAccessToken(null);
      }

      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('CURRENT AUTH STATUS', _event)
      if (session?.user) {
        const u = session.user;
        setAccessToken(session.access_token);
        setUser({
          id: u.id,
          name: u.user_metadata?.name || null,
          email: u.email || null,
          role: u.role || null,
          updated_at: u.updated_at || null,
          confirmed_at: u.confirmed_at || null,
          created_at: u.created_at || null,
          avatar_url: u.user_metadata?.avatar_url || null,
          last_sign_in_at: u.last_sign_in_at || null
        });
      } else {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Email login
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Login successful" };
  };

  // Email signup
  const signup = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: fullName || undefined } },
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Signup successful" };
  };

  // Google login
  const signInWithGoogle = async () => {
    const redirectUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/dashboard"
        : "https://your-production-site.com/dashboard";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) console.error("Google sign-in error:", error.message);
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isAuthDialogOpen,
        setIsAuthDialogOpen,
        login,
        signup,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
