"use client"

import * as React from "react"

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const clampedPage = Math.min(page, totalPages)

  React.useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage)
  }, [page, clampedPage])

  const pageItems = React.useMemo(
    () => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [items, clampedPage, pageSize]
  )

  return { page: clampedPage, setPage, totalPages, pageItems }
}
