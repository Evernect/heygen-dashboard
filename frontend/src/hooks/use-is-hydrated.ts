"use client"

import * as React from "react"

const subscribe = () => () => {}

export function useIsHydrated() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
