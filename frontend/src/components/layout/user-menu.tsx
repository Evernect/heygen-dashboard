"use client"

import * as React from "react"
import { LogOutIcon } from "lucide-react"

import { signOut } from "@/lib/auth/actions"
import type { AuthUser } from "@/lib/auth/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu({ user }: { user: AuthUser }) {
  const [pending, startTransition] = React.useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Account menu"
            className="rounded-full"
          />
        }
      >
        <Avatar size="sm">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        {/*
          Called through a transition rather than a nested <form>: a form
          inside the menu's portal is torn down as the menu closes, which
          leaves the server action's redirect with nowhere to land.
        */}
        <DropdownMenuItem
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await signOut()
            })
          }
        >
          <LogOutIcon className="size-4 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
