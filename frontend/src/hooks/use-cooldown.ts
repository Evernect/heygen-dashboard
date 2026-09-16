"use client"

import * as React from "react"

/** Counts down to zero once per second. Used to rate-limit "Resend code". */
export function useCooldown(initialSeconds = 0) {
  const [seconds, setSeconds] = React.useState(initialSeconds)

  React.useEffect(() => {
    if (seconds <= 0) return

    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  const start = React.useCallback(
    (duration: number) => setSeconds(duration),
    []
  )

  return { seconds, isCoolingDown: seconds > 0, start }
}
