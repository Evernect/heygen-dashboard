"use client"

import { Eye, Megaphone, Send, TrendingUp } from "lucide-react"

import { AnimatedItem, AnimatedList } from "@/components/motion/animated-list"
import { AnimatedNumber } from "@/components/motion/animated-number"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import type { MetricsSummary } from "@/lib/types/metrics"

export function StatCards({ summary }: { summary: MetricsSummary }) {
  const tiles = [
    {
      label: "Total views",
      icon: Eye,
      value: summary.totalViews,
      compact: true,
    },
    {
      label: "Total engagement",
      icon: TrendingUp,
      value: summary.totalEngagement,
      compact: true,
    },
    {
      label: "Avg engagement / post",
      icon: Megaphone,
      value: summary.averageEngagement,
      compact: false,
    },
    {
      label: "Posts published",
      icon: Send,
      value: summary.totalPosts,
      compact: false,
    },
  ]

  return (
    <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <AnimatedItem key={tile.label}>
          <Card className="h-full">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <tile.icon className="size-3.5" />
                {tile.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                <AnimatedNumber value={tile.value} compact={tile.compact} />
              </p>
            </CardContent>
          </Card>
        </AnimatedItem>
      ))}

      {summary.topTopic && (
        <AnimatedItem className="sm:col-span-2 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardDescription>Top performing topic</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">{summary.topTopic}</p>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}
    </AnimatedList>
  )
}
