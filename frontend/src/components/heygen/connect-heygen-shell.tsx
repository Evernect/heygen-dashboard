"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { HeygenConnectionPanel } from "@/components/heygen/heygen-connection-panel"
import { Button } from "@/components/ui/button"
import { DEFAULT_SIGNED_IN_ROUTE } from "@/lib/auth/routes"
import type { HeygenConnection } from "@/lib/types/heygen"

export function ConnectHeygenShell({
  initialConnection,
}: {
  initialConnection: HeygenConnection | null
}) {
  const router = useRouter()
  const [isLeaving, setIsLeaving] = React.useState(false)

  const goToDashboard = React.useCallback(() => {
    setIsLeaving(true)
    // `refresh` first: the dashboard layout re-checks the connection on the
    // server, and without it that check would run against a stale cache and
    // bounce the user straight back here.
    router.refresh()
    router.push(DEFAULT_SIGNED_IN_ROUTE)
  }, [router])

  return (
    <div className="space-y-5">
      <HeygenConnectionPanel
        initialConnection={initialConnection}
        connectLabel="Connect and continue"
        onConnected={goToDashboard}
      />

      {initialConnection && (
        <div className="flex justify-end border-t pt-4">
          <Button onClick={goToDashboard} disabled={isLeaving}>
            Continue to dashboard
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  )
}
