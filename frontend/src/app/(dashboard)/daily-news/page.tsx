import type { Metadata } from "next"

import { DailyNewsView } from "@/components/daily-news/daily-news-view"

export const metadata: Metadata = {
  title: "Daily News | Video Automation",
}

export default function DailyNewsPage() {
  return <DailyNewsView />
}
