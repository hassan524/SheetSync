"use client"

import { AuthProvider } from "@/context/AuthContext"
import { PwaInstallBanner } from "@/components/ui/Pwa-install-banner"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <PwaInstallBanner />
    </AuthProvider>
  )
}

