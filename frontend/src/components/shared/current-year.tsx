"use client"

import { useIsHydrated } from "@/hooks/use-is-hydrated"

export function CurrentYear({ fallback }: { fallback: number }) {
  const isHydrated = useIsHydrated()

  return <>{isHydrated ? new Date().getFullYear() : fallback}</>
}
