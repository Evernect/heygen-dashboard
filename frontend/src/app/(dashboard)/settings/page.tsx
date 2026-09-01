import type { Metadata } from "next"
import { Clock, Info, Server } from "lucide-react"

import { PageTransition } from "@/components/motion/page-transition"
import { PageHeader } from "@/components/shared/page-header"
import { ThemePreference } from "@/components/settings/theme-preference"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Settings | Video Automation",
}

export default function SettingsPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Settings"
        description="How this workspace is wired up."
      />

      <ThemePreference />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="size-4" />
            Connection
          </CardTitle>
          <CardDescription>
            Set with environment variables, so each deployment points at its own
            backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="API base URL">
            {apiBaseUrl ? (
              <code className="font-mono text-xs">{apiBaseUrl}</code>
            ) : (
              <span className="text-destructive">
                NEXT_PUBLIC_API_BASE_URL is not set
              </span>
            )}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Publishing schedule
          </CardTitle>
          <CardDescription>
            Approved scripts publish automatically - nothing needs to be left
            open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            A Supabase <code className="font-mono text-xs">pg_cron</code> job
            calls the backend every minute. It claims any approved script whose
            scheduled time has passed, renders the video, then publishes to the
            selected platforms.
          </p>
          <Separator />
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Each step is resumable: a video is only rendered once and each
            platform is only posted to once, however many times the job runs.
          </p>
        </CardContent>
      </Card>
    </PageTransition>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
