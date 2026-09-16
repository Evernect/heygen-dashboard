import { redirect } from "next/navigation"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth/user"

// Every dashboard route depends on the session cookie, so none of them may be
// prerendered or cached at build time.
export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  // Authoritative check. src/proxy.ts only does the optimistic redirect.
  const user = await getCurrentUser()
  if (!user) redirect("/login")

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
