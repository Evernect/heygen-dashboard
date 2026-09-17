import {
  ChartLine,
  ClipboardCheck,
  Library,
  Newspaper,
  Plug,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    description: "Review, approve and schedule generated scripts",
  },
  {
    title: "Daily News",
    href: "/daily-news",
    icon: Newspaper,
    description: "Topics picked from the news each morning",
  },
  {
    title: "Content Bank",
    href: "/content-bank",
    icon: Library,
    description: "Issues and angles that scripts are generated from",
  },
  {
    title: "Insights",
    href: "/insights",
    icon: ChartLine,
    description: "How published videos are performing",
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Plug,
    description: "The accounts this pipeline renders and publishes with",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Pipeline configuration",
  },
]

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}
