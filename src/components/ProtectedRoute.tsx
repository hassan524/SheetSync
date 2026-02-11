'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/"); 
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <img src="/loading.gif" alt="Loading" className="w-64 h-64" />
      </div>
    );
  }

  return <>{children}</>;
}