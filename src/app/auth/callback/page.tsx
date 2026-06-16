"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard"); // ✅ only redirect AFTER session exists
      } else {
        router.replace("/login");
      }
    };

    handleAuth();
  }, [router]);

  return <div>Signing you in...</div>;
}