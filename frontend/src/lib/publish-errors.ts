import { PLATFORM_META } from "@/lib/constants/platforms"
import type { Platform } from "@/lib/types/platform"

export interface PublishErrorExplanation {
  summary: string
  action: string | null
  technical: string
}

function metaErrorCode(raw: string): number | null {
  const match = raw.match(/\bcode (\d+)\b/)
  return match ? Number(match[1]) : null
}

function explainMetaCode(
  code: number,
  raw: string,
  platform: string
): Omit<PublishErrorExplanation, "technical"> | null {
  const lower = raw.toLowerCase()

  switch (code) {
    case 190:
      return {
        summary: `The ${platform} connection has expired, so the post could not be sent.`,
        action: `Reconnect the account and generate a fresh access token, then retry publishing.`,
      }

    case 200:
    case 10:
      if (lower.includes("blocked")) {
        return {
          summary: `${platform} has blocked this app's access, so nothing could be posted.`,
          action: `Open the Meta app dashboard and clear any required action shown there — most often an overdue Data Use Checkup, unaccepted platform terms, or lapsed business verification. Retry once access is restored.`,
        }
      }
      return {
        summary: `This app is not allowed to post to ${platform} yet.`,
        action: `Check that the app still has the publishing permissions granted, then retry.`,
      }

    case 4:
    case 17:
    case 32:
    case 613:
      return {
        summary: `${platform} is temporarily rate limiting this app — too many requests in a short window.`,
        action: `Wait a while, then retry publishing. Nothing needs to be changed.`,
      }

    case 368:
      return {
        summary: `${platform} has temporarily restricted this account for policy reasons.`,
        action: `Check the account's support inbox on ${platform} for the restriction and how long it lasts.`,
      }

    case 100:
      return {
        summary: `${platform} rejected the video or caption as invalid.`,
        action: `Check that the video is reachable and meets ${platform}'s length and format limits, then retry.`,
      }

    case 1:
    case 2:
      return {
        summary: `${platform} had a temporary problem on their end.`,
        action: `This usually clears by itself — retry publishing in a few minutes.`,
      }

    default:
      return null
  }
}

export function explainPublishError(
  raw: string | null | undefined,
  platform: Platform
): PublishErrorExplanation | null {
  if (!raw) return null

  const name = PLATFORM_META[platform]?.label ?? platform
  const lower = raw.toLowerCase()

  const code = metaErrorCode(raw)
  if (code !== null) {
    const explained = explainMetaCode(code, raw, name)
    if (explained) return { ...explained, technical: raw }
  }

  if (lower.includes("not implemented yet")) {
    return {
      summary: `Publishing to ${name} is not supported yet.`,
      action: `Remove ${name} from this script's platforms, or publish there manually.`,
      technical: raw,
    }
  }

  if (lower.includes("still processing after")) {
    return {
      summary: `${name} was still processing the video when we stopped waiting.`,
      action: `It may still have gone live — check the ${name} account before retrying, so you don't post it twice.`,
      technical: raw,
    }
  }

  if (lower.includes("failed processing") || lower.includes("failed to process")) {
    return {
      summary: `${name} could not process the video file.`,
      action: `Check the rendered video plays correctly, then retry publishing.`,
      technical: raw,
    }
  }

  if (lower.includes("did not return")) {
    return {
      summary: `${name} accepted the upload but did not confirm it.`,
      action: `Check the ${name} account before retrying, so you don't post it twice.`,
      technical: raw,
    }
  }

  if (lower.includes("no rendered video")) {
    return {
      summary: `This script has no rendered video to publish.`,
      action: `Generate the video, then approve it again.`,
      technical: raw,
    }
  }

  const cleaned = raw.replace(/^Graph API error:\s*/i, "").split(" | ")[0]
  return {
    summary: `${name} refused the post: ${cleaned}`,
    action: `Retry publishing. If it keeps failing, the technical detail below has the error code.`,
    technical: raw,
  }
}

export function explainScriptError(raw: string | null | undefined): string | null {
  if (!raw) return null

  const failures = raw.match(/^(\d+) platform publish\(es\) failed/)
  if (failures) {
    const count = Number(failures[1])
    return count === 1
      ? "One platform could not be posted to. See the reason below."
      : `${count} platforms could not be posted to. See the reasons below.`
  }

  if (/^Gave up after \d+ attempts/i.test(raw)) {
    return "Publishing was retried several times and kept failing, so it has been stopped. Fix the problem below, then retry."
  }

  if (/none of the selected platforms/i.test(raw)) {
    return "None of the selected platforms can be published to yet. Pick Facebook or Instagram."
  }

  return raw
}
