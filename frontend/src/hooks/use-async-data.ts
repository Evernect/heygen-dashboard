"use client"

import * as React from "react"

export interface AsyncDataState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isRefreshing: boolean
  refetch: () => Promise<void>
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): AsyncDataState<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetcherRef = React.useRef(fetcher)
  React.useEffect(() => {
    fetcherRef.current = fetcher
  })

  const requestId = React.useRef(0)

  const depsKey = JSON.stringify(deps)
  const [lastDepsKey, setLastDepsKey] = React.useState(depsKey)
  if (depsKey !== lastDepsKey) {
    setLastDepsKey(depsKey)
    setIsLoading(true)
    setData(null)
    setError(null)
  }

  const load = React.useCallback(async (isRefresh: boolean) => {
    const id = ++requestId.current
    if (isRefresh) setIsRefreshing(true)

    try {
      const result = await fetcherRef.current()
      if (id !== requestId.current) return
      setData(result)
      setError(null)
    } catch (caught) {
      if (id !== requestId.current) return
      setError(caught instanceof Error ? caught : new Error(String(caught)))
    } finally {
      if (id === requestId.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  React.useEffect(() => {
    void load(false)
  }, deps)

  const refetch = React.useCallback(() => load(true), [load])

  return { data, error, isLoading, isRefreshing, refetch, setData }
}
