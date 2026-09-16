"use client"

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

export function FormAlert({
  error,
  message,
}: {
  error?: string
  message?: string
}) {
  if (!error && !message) return null

  return (
    <Alert variant={error ? "destructive" : "default"}>
      {error ? (
        <CircleAlertIcon />
      ) : (
        <CircleCheckIcon className="text-[var(--status-approved)]" />
      )}
      <AlertDescription
        className={error ? "text-destructive/90" : "text-foreground"}
      >
        {error ?? message}
      </AlertDescription>
    </Alert>
  )
}
