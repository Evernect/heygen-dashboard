"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon, KeyRound, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { ApiError } from "@/lib/api/client"
import { saveHeygenConnection } from "@/lib/api/heygen"
import type { HeygenConnection } from "@/lib/types/heygen"

const MIN_KEY_LENGTH = 10

function messageFor(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "HeyGen rejected this API key. Check you copied it in full from HeyGen → Settings → API, and that it has not been revoked."
    }
    return error.message
  }

  return error instanceof Error
    ? error.message
    : "Could not reach the server. Check it is running and try again."
}

export function HeygenKeyForm({
  submitLabel,
  onSaved,
  onCancel,
  autoFocus,
}: {
  submitLabel: string
  onSaved: (connection: HeygenConnection) => void
  onCancel?: () => void
  autoFocus?: boolean
}) {
  const id = React.useId()
  const [apiKey, setApiKey] = React.useState("")
  const [visible, setVisible] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isVerifying, setIsVerifying] = React.useState(false)

  const trimmed = apiKey.trim()
  const canSubmit = trimmed.length >= MIN_KEY_LENGTH && !isVerifying

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setIsVerifying(true)
    setError(null)

    try {
      const { connection } = await saveHeygenConnection(trimmed)
      if (!connection) throw new Error("The server did not return a connection.")

      setApiKey("")
      onSaved(connection)
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field data-invalid={error !== null || undefined}>
        <FieldLabel htmlFor={id}>HeyGen API key</FieldLabel>

        <InputGroup aria-invalid={error !== null || undefined}>
          <InputGroupAddon>
            <KeyRound className="size-4 text-muted-foreground" />
          </InputGroupAddon>

          <InputGroupInput
            id={id}
            name="heygenApiKey"
            autoFocus={autoFocus}
            spellCheck={false}
            disabled={isVerifying}
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
            type={visible ? "text" : "password"}
            placeholder="Paste your HeyGen API key"
            value={apiKey}
            onChange={(event) => {
              setApiKey(event.target.value)
              if (error) setError(null)
            }}
          />

          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              tabIndex={-1}
              aria-label={visible ? "Hide API key" : "Show API key"}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {error ? (
          <FieldDescription
            role="alert"
            className="flex items-start gap-1.5 text-destructive"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </FieldDescription>
        ) : (
          <FieldDescription>
            Found in HeyGen under Settings → API. It is verified against your
            HeyGen account before it is saved, and stored encrypted.
          </FieldDescription>
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={!canSubmit}>
          {isVerifying && <Spinner />}
          {isVerifying ? "Verifying with HeyGen…" : submitLabel}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            disabled={isVerifying}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
