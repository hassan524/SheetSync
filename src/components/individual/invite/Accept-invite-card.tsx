"use client";

import { api } from "@/lib/api/api-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const withInviteAcceptedFlag = (path: string) => {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("invite", "accepted");
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
};

export default function AcceptInviteCard({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStarted = useRef(false);
  const { user, loading: authLoading, loginWithGoogle } = useAuth();

  const nextPath = searchParams?.get("next");
  const safeNextPath = nextPath?.startsWith("/") ? nextPath : null;

  const acceptInvite = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/invites/accept", { token });
      const data = response?.data ?? response;
      const baseDestination =
        safeNextPath ||
        (data?.organizationId
          ? `/organizations/${data.organizationId}`
          : "/dashboard");
      const destination = safeNextPath
        ? withInviteAcceptedFlag(baseDestination)
        : baseDestination;

      router.replace(destination);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || err?.message || "Failed to accept invite",
      );
    } finally {
      setLoading(false);
    }
  }, [router, safeNextPath, token]);

  useEffect(() => {
    if (authLoading) return;
    if (hasStarted.current) return;

    if (!user) {
      hasStarted.current = true;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      loginWithGoogle(currentPath);
      return;
    }

    hasStarted.current = true;
    acceptInvite();
  }, [authLoading, user, loginWithGoogle, acceptInvite]);

  if (authLoading || (!user && !error)) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-8 w-[360px] text-center border border-gray-100">
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-8 w-[360px] text-center border border-gray-100">
        <p className="text-sm text-gray-500">Joining…</p>
      </div>
    );
  }

  if (!error) return null;

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 w-[360px] text-center border border-gray-100">
      <div className="space-y-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={acceptInvite}
          className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}