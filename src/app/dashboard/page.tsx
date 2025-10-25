import ProtectedRoute from "@/components/ProtectedRoute"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SheetsPageClient } from "@/components/Sheets-page-client"

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SheetsPageClient />
      </SidebarProvider>
    </ProtectedRoute>
  )
}
