import { redirect } from "next/navigation"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { loadHeygenConnection } from "@/lib/api/server"
import { CONNECT_HEYGEN_ROUTE } from "@/lib/auth/routes"
import { getCurrentUser } from "@/lib/auth/user"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const heygen = await loadHeygenConnection()
  if (heygen.status === "disconnected") redirect(CONNECT_HEYGEN_ROUTE)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader user={user} />
        <main className="flex-1 space-y-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
