"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import GlobalLoader from "@/components/common/Global-loader";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const next = searchParams?.get("next");
      const safeNext = next && next.startsWith("/") ? next : null;

      router.replace(session ? safeNext || "/dashboard" : "/login");
    };

    handleAuth();
  }, [router, searchParams]);

  return <GlobalLoader />;
}