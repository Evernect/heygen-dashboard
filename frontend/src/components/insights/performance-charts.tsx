"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PLATFORM_META } from "@/lib/constants/platforms"
import { formatCompactNumber, formatDate } from "@/lib/format"
import type {
  EngagementPoint,
  PlatformPerformance,
  TopicPerformance,
} from "@/lib/types/metrics"

const engagementConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  likes: { label: "Likes", color: "var(--chart-2)" },
  comments: { label: "Comments", color: "var(--chart-3)" },
  shares: { label: "Shares", color: "var(--chart-4)" },
} satisfies ChartConfig

export function EngagementOverTimeChart({
  data,
}: {
  data: EngagementPoint[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement over time</CardTitle>
        <CardDescription>
          Views and interactions by the date each video was published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={engagementConfig} className="h-64 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatDate(String(value))}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={44}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="views"
              type="monotone"
              stroke="var(--color-views)"
              fill="var(--color-views)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
            <Area
              dataKey="likes"
              type="monotone"
              stroke="var(--color-likes)"
              fill="var(--color-likes)"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const topicConfig = {
  engagement: { label: "Engagement", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TopTopicsChart({ data }: { data: TopicPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Best performing topics</CardTitle>
        <CardDescription>Total engagement per topic.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={topicConfig} className="h-64 w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 4, right: 12 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <YAxis
              type="category"
              dataKey="issue"
              tickLine={false}
              axisLine={false}
              width={140}
              tickFormatter={(value) =>
                String(value).length > 22
                  ? `${String(value).slice(0, 21)}…`
                  : String(value)
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="engagement"
              fill="var(--color-engagement)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const platformConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  engagement: { label: "Engagement", color: "var(--chart-2)" },
} satisfies ChartConfig

export function PlatformPerformanceChart({
  data,
}: {
  data: PlatformPerformance[]
}) {
  const rows = data.map((entry) => ({
    ...entry,
    label: PLATFORM_META[entry.platform].label,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform performance</CardTitle>
        <CardDescription>How each channel is doing.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={platformConfig} className="h-64 w-full">
          <BarChart data={rows} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="views" fill="var(--color-views)" radius={4} />
            <Bar
              dataKey="engagement"
              fill="var(--color-engagement)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
