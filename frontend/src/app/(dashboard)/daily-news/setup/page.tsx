import type { Metadata } from "next"

import { NewsSetupView } from "@/components/daily-news/news-setup-view"

export const metadata: Metadata = {
  title: "News sources | Video Automation",
}

export default function NewsSetupPage() {
  return <NewsSetupView />
}
