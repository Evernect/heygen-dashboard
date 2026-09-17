"use client"

import { CheckCircle2, CircleSlash, Share2, TriangleAlert } from "lucide-react"

import { SettingsSection } from "@/components/settings/settings-section"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { PLATFORM_META } from "@/lib/constants/platforms"
import type { MetaStatus } from "@/lib/types/integrations"

const ENV_VAR: Record<string, string> = {
  FACEBOOK: "FACEBOOK_PAGE_ID",
  INSTAGRAM: "INSTAGRAM_BUSINESS_ACCOUNT_ID",
}

export function MetaSection({ status }: { status: MetaStatus }) {
  return (
    <SettingsSection
      icon={Share2}
      title="Facebook and Instagram"
      description="Where approved videos are published. Still read from the backend environment, so these are the same for everyone on this deployment — connecting them per account comes later."
    >
      <div className="space-y-4">
        {status.dryRun && (
          <p className="flex items-start gap-2 rounded-lg bg-status-pending/10 p-2.5 text-xs text-status-pending-foreground dark:text-status-pending">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <code className="font-mono">DRY_RUN_META</code> is on. The
              pipeline runs end to end but nothing is actually posted.
            </span>
          </p>
        )}

        {!status.accessTokenConfigured && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              No <code className="font-mono">META_PAGE_ACCESS_TOKEN</code> is
              set, so neither platform can publish whatever else is configured.
            </span>
          </p>
        )}

        <ItemGroup className="gap-2">
          {status.platforms.map((entry) => {
            const meta = PLATFORM_META[entry.platform]

            return (
              <Item key={entry.platform} variant="outline">
                <ItemMedia variant="icon">
                  {entry.configured ? (
                    <CheckCircle2 className="text-status-approved-foreground" />
                  ) : (
                    <CircleSlash className="text-muted-foreground" />
                  )}
                </ItemMedia>

                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">
                    {meta.label}
                    <Badge
                      variant={entry.configured ? "outline" : "secondary"}
                      className="gap-1 font-normal"
                    >
                      {entry.configured ? (
                        <>
                          <span className="size-1.5 rounded-full bg-status-approved" />
                          Configured
                        </>
                      ) : (
                        "Not configured"
                      )}
                    </Badge>
                  </ItemTitle>

                  <ItemDescription>
                    {entry.targetConfigured
                      ? `Set from ${ENV_VAR[entry.platform]}.`
                      : `Add ${ENV_VAR[entry.platform]} to the backend .env to publish here.`}
                  </ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
        </ItemGroup>
      </div>
    </SettingsSection>
  )
}
