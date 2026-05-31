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
import { usePush } from "@/hooks/notfication/use-push";
import { getCurrentAppOrigin } from "@/lib/app-url";

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

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: (redirectPath?: string) => Promise<AuthError | null>;
  logout: () => Promise<void>;
}

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

    setUser({
      id: u.id,
      name: u.user_metadata?.name || null,
      email: u.email || null,
      avatar_url: u.user_metadata?.avatar_url || null,
      last_sign_in_at: u.last_sign_in_at || null,
    });

    setAccessToken(session.access_token);
  };

  const clearSession = () => {
    setUser(null);
    setAccessToken(null);
  };

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUserFromSession(session);
      }

      setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUserFromSession(session);
        } else {
          clearSession();
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  usePush(user?.id);

  // -----------------------
  // Google login
  // -----------------------
  const loginWithGoogle = async (
    redirectPath = "/dashboard",
  ): Promise<AuthError | null> => {
    const appUrl = getCurrentAppOrigin();
    const safeRedirectPath = redirectPath.startsWith("/")
      ? redirectPath
      : "/dashboard";
    const redirectUrl = `${appUrl}${safeRedirectPath}`;

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
// Hook
// -----------------------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
