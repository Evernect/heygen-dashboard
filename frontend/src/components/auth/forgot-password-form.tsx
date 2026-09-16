"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { requestPasswordReset } from "@/lib/auth/actions"
import { emptyAuthFormState, fieldError } from "@/lib/auth/form-state"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { SubmitButton } from "@/components/auth/submit-button"

export function ForgotPasswordForm() {
  const [state, formAction, pending] = React.useActionState(
    requestPasswordReset,
    emptyAuthFormState
  )

  return (
    <div className="space-y-4">
      <AuthHeader
        title="Reset your password"
        description="We'll email you a 6-digit code to set a new one."
      />

      <form action={formAction} className="space-y-3">
        <FormAlert error={state.error} />

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "email"))}
        >
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(fieldError(state, "email"))}
            className="h-9"
            required
          />
          <FieldError>{fieldError(state, "email")}</FieldError>
        </Field>

        <SubmitButton pending={pending}>Send reset code</SubmitButton>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to sign in
      </Link>
    </div>
  )
}
