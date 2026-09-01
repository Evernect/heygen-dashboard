"use client"

import * as React from "react"

let now = Date.now()
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (!timer) {
    timer = setInterval(() => {
      now = Date.now()
      for (const notify of listeners) notify()
    }, 30_000)
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

const getSnapshot = () => now

// The server has no meaningful "now" for the viewer. Epoch means nothing reads
// as being in the past, which is the safe default for validation UI.
const getServerSnapshot = () => 0

/** @returns the current time as a timestamp, refreshed every 30 seconds. */
export function useNow() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
