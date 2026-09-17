"use client"

import * as React from "react"
import { CheckCircle2, KeyRound, Link2Off, RefreshCw } from "lucide-react"

import { HeygenKeyForm } from "@/components/heygen/heygen-key-form"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { disconnectHeygen } from "@/lib/api/heygen"
import { formatDateTime } from "@/lib/format"
import type { HeygenConnection } from "@/lib/types/heygen"

export function HeygenConnectionPanel({
  initialConnection,
  onConnected,
  connectLabel = "Connect HeyGen",
  allowDisconnect = true,
}: {
  initialConnection: HeygenConnection | null
  onConnected?: (connection: HeygenConnection) => void
  connectLabel?: string
  allowDisconnect?: boolean
}) {
  const { notifySuccess, notifyError } = useToastFeedback()

  const [connection, setConnection] = React.useState(initialConnection)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDisconnecting, setIsDisconnecting] = React.useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false)

  function handleSaved(next: HeygenConnection) {
    const wasConnected = connection !== null

    setConnection(next)
    setIsEditing(false)

    notifySuccess(
      wasConnected ? "API key updated" : "HeyGen connected",
      next.accountEmail
        ? `Verified against ${next.accountEmail}.`
        : "Verified against your HeyGen account."
    )

    onConnected?.(next)
  }

  async function handleDisconnect() {
    setIsDisconnecting(true)
    try {
      await disconnectHeygen()
      setConnection(null)
      setIsEditing(false)
      setConfirmDisconnect(false)
      notifySuccess(
        "HeyGen disconnected",
        "Nothing will render until a key is connected again."
      )
    } catch (caught) {
      notifyError("Could not disconnect", caught)
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!connection) {
    return (
      <HeygenKeyForm
        autoFocus
        submitLabel={connectLabel}
        onSaved={handleSaved}
      />
    )
  }

  const account =
    connection.accountEmail ?? connection.accountUsername ?? "HeyGen account"

  return (
    <div className="space-y-4">
      <Item variant="outline" className="bg-muted/30">
        <ItemMedia variant="icon" className="text-status-approved-foreground">
          <CheckCircle2 />
        </ItemMedia>

        <ItemContent>
          <ItemTitle className="flex flex-wrap items-center gap-2">
            {account}
            <Badge variant="outline" className="gap-1 font-normal">
              <span className="size-1.5 rounded-full bg-status-approved" />
              Connected
            </Badge>
          </ItemTitle>

          {/* HeyGen's `username` is an opaque account id, not a display name,
              so it is only worth showing when there is no email to show. */}
          <ItemDescription className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <KeyRound className="size-3" />
              {connection.apiKeyHint}
            </span>
            {connection.lastVerifiedAt && (
              <span>
                Verified {formatDateTime(connection.lastVerifiedAt)}
              </span>
            )}
          </ItemDescription>
        </ItemContent>

        {!isEditing && (
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <RefreshCw />
              Update key
            </Button>

            {allowDisconnect && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isDisconnecting}
                onClick={() => setConfirmDisconnect(true)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Link2Off />
                Disconnect
              </Button>
            )}
          </ItemActions>
        )}
      </Item>

      {isEditing && (
        <HeygenKeyForm
          autoFocus
          submitLabel="Save new key"
          onSaved={handleSaved}
          onCancel={() => setIsEditing(false)}
        />
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="Disconnect HeyGen?"
        description="The stored key is deleted. Nothing can be rendered until a key is connected again."
        confirmLabel="Disconnect"
        destructive
        isPending={isDisconnecting}
        onConfirm={handleDisconnect}
      />
    </div>
  )
}
