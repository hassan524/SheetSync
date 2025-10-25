"use client"

import { AuthProvider } from "@/context/AuthContext"
import { ReactNode } from "react"
import { SheetProvider } from "@/context/SheetContext"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SheetProvider>
        {children}
      </SheetProvider>
    </AuthProvider>
  )
}
