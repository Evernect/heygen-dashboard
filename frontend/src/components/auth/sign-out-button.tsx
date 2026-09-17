"use client"

import * as React from "react"
import { LogOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { signOut } from "@/lib/auth/actions"

export function SignOutButton({
  children = "Log out",
  onClick,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const [pending, startTransition] = React.useTransition()

  return (
    <Button
      variant="ghost"
      {...props}
      disabled={pending || disabled}
      onClick={(event) => {
        onClick?.(event)
        startTransition(async () => {
          await signOut()
        })
      }}
    >
      {pending ? <Spinner /> : <LogOutIcon />}
      {children}
    </Button>
  )
}
