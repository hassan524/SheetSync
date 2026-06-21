"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/api-client";
import { useAuth } from "@/context/AuthContext";
export function useSheetInviteAcceptance(sheetId: string) {
  const { user, loading: authLoading, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const hasStarted = useRef(false);

  const invited = searchParams?.get("invited") === "true";
  const inviteToken = searchParams?.get("inviteToken");
  const role = searchParams?.get("role") || "viewer";

  useEffect(() => {
    if (!invited || !inviteToken) return;
    if (authLoading) return;
    if (hasStarted.current) return;

    if (!user) {
      hasStarted.current = true;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      loginWithGoogle(currentPath);
      return;
    }

    hasStarted.current = true;
    api
      .post("/invites/accept", {
        token: inviteToken,
        inviteByLink: true,
        sheetId,
        role,
      })
      .catch((err) => {
        console.error("Failed to accept sheet invite:", err);
      });
  }, [invited, inviteToken, role, sheetId, authLoading, user, loginWithGoogle]);
}