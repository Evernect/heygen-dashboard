/**
 * The page numbers to show, with ellipses standing in for the gaps.
 *
 * Always keeps the first page, the last page and the current page's immediate
 * neighbours, so the control never reflows as you move through it.
 */
export function getPageNumbers(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis")
    result.push(page)
  })

  return result
}
