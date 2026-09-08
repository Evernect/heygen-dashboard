import {
  CalendarClock,
  ChartLine,
  ClipboardCheck,
  Library,
  MessageSquareText,
  ScanFace,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export interface PipelineStage {
  title: string
  icon: LucideIcon
  body: string
  points: string[]
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    title: "Bank the topic",
    icon: Library,
    body: "Every video starts as an issue paired with an angle. Add them one at a time or bulk-import a spreadsheet, and the bank tracks how often each topic has been used and when it last ran.",
    points: [
      "Issue + angle, kept reusable",
      "Bulk import from a spreadsheet",
      "Usage counts so nothing repeats itself",
    ],
  },
  {
    title: "Three takes, not one",
    icon: Sparkles,
    body: "One topic goes in and three genuinely different scripts come back. Each one has a different hook, a different line of argument and a different closing beat. Every variant is labelled with its take so you can compare them at a glance.",
    points: [
      "75-90 words, paced for a 35-second read",
      "First-person talking head, SSML pauses built in",
      'Labelled takes like "Direct challenge" or "Cost to residents"',
    ],
  },
  {
    title: "Captions per platform",
    icon: MessageSquareText,
    body: "Each script arrives with copy written separately for Facebook, Instagram, YouTube, TikTok and X, plus a hashtag set. It is never one caption pasted across five feeds.",
    points: [
      "Five platform captions per script",
      "Hashtags generated alongside",
      "Editable before anything is approved",
    ],
  },
  {
    title: "Render the avatar",
    icon: ScanFace,
    body: "Pick a take and HeyGen renders it as an avatar video using the look, voice and speaking speed you configured in Settings. Render progress streams straight into the board.",
    points: [
      "Browse avatar looks and voices live",
      "Progress polling while it builds",
      "Dry-run mode so you can test without burning credits",
    ],
  },
  {
    title: "You approve, then you schedule",
    icon: ClipboardCheck,
    body: "Nothing publishes that a human has not signed off. Preview the video, edit the script or captions, choose the target platforms and pick the exact slot, or reject it with a reason and send the topic back.",
    points: [
      "Inline video preview before approval",
      "Pick platforms and an exact date and time",
      "Reject with a reason, retry anything that failed",
    ],
  },
  {
    title: "Publishes without a babysitter",
    icon: CalendarClock,
    body: "A Postgres cron job claims due posts every minute and posts each one exactly once. There is no worker process to keep alive, and a retry can never produce a duplicate post.",
    points: [
      "Runs in the database, not a server you maintain",
      "Claimed with SKIP LOCKED, so one post per platform, ever",
      "Video re-hosted on public storage before it goes out",
    ],
  },
]

export interface LandingFeature {
  title: string
  description: string
  icon: LucideIcon
  className?: string
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    title: "A content bank, not a prompt box",
    description:
      "Topics live as reusable issue-and-angle pairs with usage history, so your pipeline always has something to draw from and never repeats last week's video.",
    icon: Library,
    className: "md:col-span-2",
  },
  {
    title: "Three scripts per topic",
    description:
      "Distinct hooks, arguments and closes. You choose the one that lands.",
    icon: Sparkles,
  },
  {
    title: "Written per platform",
    description:
      "Facebook, Instagram, YouTube, TikTok and X captions, plus hashtags, generated for each script.",
    icon: MessageSquareText,
  },
  {
    title: "A real approval gate",
    description:
      "Preview the rendered video, edit the script and captions, reject with a reason, or retry a failed render. Nothing reaches a feed unreviewed.",
    icon: ClipboardCheck,
    className: "md:col-span-2",
  },
  {
    title: "Publishes exactly once",
    description:
      "Due posts are claimed atomically and constrained to one post per script per platform, so retries and overlapping runs stay harmless.",
    icon: ShieldCheck,
    className: "md:col-span-2",
  },
  {
    title: "Insights when it lands",
    description:
      "Views, engagement and top-performing topics once posts start collecting metrics.",
    icon: ChartLine,
  },
]
