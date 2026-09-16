"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function SubmitButton({
  pending,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending || props.disabled}
      className={cn("w-full", className)}
      {...props}
    >
      {pending ? <Spinner /> : null}
      {children}
    </Button>
  )
}
