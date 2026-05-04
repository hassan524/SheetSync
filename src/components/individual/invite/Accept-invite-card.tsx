"use client";

import { api } from "@/lib/api/api-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Users, Loader2 } from "lucide-react";

export default function AcceptInviteCard({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const acceptInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/invites/accept", { token });
      const data = response?.data ?? response;

      setOrgId(data?.organizationId ?? null);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || err?.message || "Failed to accept invite"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-10 w-[440px] text-center border border-gray-100">
      <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
        <Users className="h-6 w-6 text-emerald-600" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Organization Invite</h2>

      <p className="text-gray-500 text-sm mb-8">
        You have been invited to join an organization on SheetSync.
      </p>

      {success ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Invite accepted successfully!</span>
          </div>
          {orgId && (
            <button
              onClick={() => router.push(`/organizations/${orgId}`)}
              className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition font-medium text-sm"
            >
              Go to Organization →
            </button>
          )}
        </div>
      ) : error ? (
        <div className="space-y-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={acceptInvite}
            className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <button
          onClick={acceptInvite}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition font-medium text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Accepting…
            </>
          ) : (
            "Accept Invite"
          )}
        </button>
      )}
    </div>
  );
}