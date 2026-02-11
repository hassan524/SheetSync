"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthError, Session } from "@supabase/supabase-js";
import Cookies from "js-cookie";

// -----------------------
// User type
// -----------------------
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_sign_in_at: string | null;
}

// -----------------------
// Context type
// -----------------------
interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<AuthError | null>;
  logout: () => Promise<void>;
}

// -----------------------
// Create context
// -----------------------
const AuthContext = createContext<AuthContextType | null>(null);

// -----------------------
// Provider
// -----------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setUserFromSession = (session: Session) => {
    const u = session.user;
    const token = session.access_token;

    setUser({
      id: u.id,
      name: u.user_metadata?.name || null,
      email: u.email || null,
      avatar_url: u.user_metadata?.avatar_url || null,
      last_sign_in_at: u.last_sign_in_at || null,
    });

    setAccessToken(token);

    // Store access token in cookie (expires in 1 day)
    Cookies.set("my-supabase-session", token, {
      expires: 1,
      path: "/",
      sameSite: "lax",
    });
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
    Cookies.remove("my-supabase-session");
  };

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) setUserFromSession(session);
      console.log("current session", session);
      setLoading(false);
    };

    initSession();

    // Listen to auth changes (login / logout / token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) setUserFromSession(session);
        else {
          clearSession();
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // -----------------------
  // Google login
  // -----------------------
  const loginWithGoogle = async (): Promise<AuthError | null> => {
    const redirectUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/dashboard"
        : "https://your-production-site.com/dashboard";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) console.error("Google sign-in error:", error.message);
    return error;
  };

  // -----------------------
  // Logout
  // -----------------------
  const logout = async () => {
    await supabase.auth.signOut();
    clearSession();
  };

  // -----------------------
  // Provide context
  // -----------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -----------------------
// Hook for convenience
// -----------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
