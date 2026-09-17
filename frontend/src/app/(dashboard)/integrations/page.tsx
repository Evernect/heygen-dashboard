import type { Metadata } from "next"
import { AlertTriangle } from "lucide-react"

import { HeygenAccountSection } from "@/components/integrations/heygen-account-section"
import { MetaSection } from "@/components/integrations/meta-section"
import { PageTransition } from "@/components/motion/page-transition"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { loadIntegrations } from "@/lib/api/server"

export const metadata: Metadata = {
  title: "Integrations | Video Automation",
}

export const dynamic = "force-dynamic"

export default async function IntegrationsPage() {
  const result = await loadIntegrations()

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Integrations"
        description="The accounts this pipeline renders and publishes with."
      />

      {result.status === "unavailable" ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Could not load integrations</AlertTitle>
          <AlertDescription>
            {result.message} Check the backend is running, then reload.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <HeygenAccountSection
            connection={result.integrations.heygen.connection}
          />
          <MetaSection status={result.integrations.meta} />
        </>
      )}
    </PageTransition>
  )
}
