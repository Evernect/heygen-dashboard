"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { PLATFORM_META } from "@/lib/constants/platforms"
import type { Platform } from "@/lib/types/platform"

export type CaptionField =
  | "facebookCaption"
  | "instagramCaption"
  | "youtubeCaption"
  | "tiktokCaption"
  | "xPostText"

const CAPTION_TABS: {
  field: CaptionField
  platform: Platform
  hint: string
  limit?: number
}[] = [
  {
    field: "facebookCaption",
    platform: "FACEBOOK",
    hint: "Conversational and community-focused.",
  },
  {
    field: "instagramCaption",
    platform: "INSTAGRAM",
    hint: "Short and punchy — sits above the hashtag block.",
  },
  {
    field: "youtubeCaption",
    platform: "YOUTUBE",
    hint: "Reads as a Shorts description.",
  },
  {
    field: "tiktokCaption",
    platform: "TIKTOK",
    hint: "Exactly one attention-grabbing line.",
  },
  {
    field: "xPostText",
    platform: "X",
    hint: "Standalone post.",
    limit: 280,
  },
]

export function CaptionTabs({
  values,
  onChange,
  readOnly,
}: {
  values: Record<CaptionField, string | null>
  onChange: (field: CaptionField, value: string) => void
  readOnly?: boolean
}) {
  return (
    <Tabs defaultValue={CAPTION_TABS[0].field}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {CAPTION_TABS.map(({ field, platform }) => (
          <TabsTrigger key={field} value={field}>
            {PLATFORM_META[platform].label}
          </TabsTrigger>
        ))}
      </TabsList>

      {CAPTION_TABS.map(({ field, hint, limit }) => {
        const value = values[field] ?? ""
        const overLimit = limit ? value.length > limit : false

        return (
          <TabsContent key={field} value={field} className="mt-3 space-y-2">
            <Textarea
              value={value}
              readOnly={readOnly}
              rows={4}
              onChange={(event) => onChange(field, event.target.value)}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{hint}</p>
              {limit && (
                <Badge
                  variant={overLimit ? "destructive" : "secondary"}
                  className="tabular-nums"
                >
                  {value.length} / {limit}
                </Badge>
              )}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
