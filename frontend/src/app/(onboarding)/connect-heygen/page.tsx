import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AlertTriangle, Clapperboard } from "lucide-react"

import { ConnectHeygenShell } from "@/components/heygen/connect-heygen-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { loadHeygenConnection } from "@/lib/api/server"
import { getCurrentUser } from "@/lib/auth/user"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Connect HeyGen | Video Automation",
}

export default async function ConnectHeygenPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const result = await loadHeygenConnection()
  const connection = result.status === "connected" ? result.connection : null

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Clapperboard className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {connection ? "Your HeyGen account" : "Connect your HeyGen account"}
            </CardTitle>
            <CardDescription className="leading-relaxed">
              {connection
                ? "This is the account your avatar videos render on. Swap the key whenever you rotate it."
                : "Every video in this pipeline is rendered by HeyGen, so the dashboard needs your API key before it can do anything useful."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-(--card-spacing)">
        {result.status === "unavailable" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Could not reach the API</AlertTitle>
            <AlertDescription>
              Your existing connection could not be read, so this screen may be
              showing you as not connected. Check the backend is running.
            </AlertDescription>
          </Alert>
        )}

        <ConnectHeygenShell initialConnection={connection} />
      </CardContent>
    </Card>
  )
}
