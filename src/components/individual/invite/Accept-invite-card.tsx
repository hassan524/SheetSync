"use client";

import { api } from "@/lib/api/api-client";
import { useState } from "react";

export default function AcceptInviteCard({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const acceptInvite = async () => {
    try {
      setLoading(true);

      await api.post("/invites/accept", {
        token,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-10 w-[420px] text-center">
      <h2 className="text-2xl font-semibold mb-4">
        Organization Invite
      </h2>

      <p className="text-gray-500 mb-8">
        You have been invited to join this organization.
      </p>

      {success ? (
        <p className="text-green-600 font-medium">
          Invite accepted successfully
        </p>
      ) : (
        <button
          onClick={acceptInvite}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition"
        >
          {loading ? "Accepting..." : "Accept Invite"}
        </button>
      )}
    </div>
  );
}