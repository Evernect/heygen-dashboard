"use client"

import * as React from "react"
import Link from "next/link"

import {
  confirmPasswordReset,
  resendPasswordResetOtp,
} from "@/lib/auth/actions"
import { emptyAuthFormState, fieldError } from "@/lib/auth/form-state"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { OtpFields } from "@/components/auth/otp-fields"
import { PasswordInput } from "@/components/auth/password-input"
import { ResendCodeButton } from "@/components/auth/resend-code-button"
import { SubmitButton } from "@/components/auth/submit-button"

export function ResetPasswordForm({ email: initialEmail }: { email: string }) {
  const [state, formAction, pending] = React.useActionState(
    confirmPasswordReset,
    emptyAuthFormState
  )
  const [resendState, resendAction, resendPending] = React.useActionState(
    resendPasswordResetOtp,
    emptyAuthFormState
  )
  const [email, setEmail] = React.useState(initialEmail)

  const tokenError = fieldError(state, "token")

  return (
    <div className="space-y-4">
      <AuthHeader
        title="Choose a new password"
        description="Enter the code we emailed you, then pick a new password."
      />

      <form action={formAction} className="space-y-3">
        <FormAlert
          error={state.error ?? resendState.error}
          message={resendState.message}
        />

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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldError(state, "email"))}
            className="h-9"
            required
          />
          <FieldError>{fieldError(state, "email")}</FieldError>
        </Field>

        <Field className="gap-1.5" data-invalid={Boolean(tokenError)}>
          <FieldLabel htmlFor="token">Verification code</FieldLabel>
          <OtpFields invalid={Boolean(tokenError)} autoFocus={false} />
          <FieldError>{tokenError}</FieldError>
        </Field>

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "password"))}
        >
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(fieldError(state, "password"))}
            required
          />
          <FieldError>{fieldError(state, "password")}</FieldError>
        </Field>

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "confirmPassword"))}
        >
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            aria-invalid={Boolean(fieldError(state, "confirmPassword"))}
            required
          />
          <FieldError>{fieldError(state, "confirmPassword")}</FieldError>
        </Field>

        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>

      <div className="flex flex-col items-center gap-1">
        <ResendCodeButton
          formAction={resendAction}
          pending={resendPending}
          email={email}
        />
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
