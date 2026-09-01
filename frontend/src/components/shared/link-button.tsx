import Link from "next/link"

import { Button } from "@/components/ui/button"

export function LinkButton({
  href,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "render" | "nativeButton"> & {
  href: React.ComponentProps<typeof Link>["href"]
}) {
  return (
    <Button {...props} nativeButton={false} render={<Link href={href} />}>
      {children}
    </Button>
  )
}
