import type { Metadata } from "next"

import { ContentBankView } from "@/components/content-bank/content-bank-view"

export const metadata: Metadata = {
  title: "Content Bank | Video Automation",
}

export default function ContentBankPage() {
  return <ContentBankView />
}
