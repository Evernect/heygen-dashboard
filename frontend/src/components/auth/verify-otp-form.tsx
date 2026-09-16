"use client"

import * as React from "react"
import Link from "next/link"

import { resendSignUpOtp, verifyEmailOtp } from "@/lib/auth/actions"
import { emptyAuthFormState, fieldError } from "@/lib/auth/form-state"
import { Field, FieldError } from "@/components/ui/field"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { OtpFields } from "@/components/auth/otp-fields"
import { ResendCodeButton } from "@/components/auth/resend-code-button"
import { SubmitButton } from "@/components/auth/submit-button"

export function VerifyOtpForm({ email }: { email: string }) {
  const [state, formAction, pending] = React.useActionState(
    verifyEmailOtp,
    emptyAuthFormState
  )
  const [resendState, resendAction, resendPending] = React.useActionState(
    resendSignUpOtp,
    emptyAuthFormState
  )
  const formRef = React.useRef<HTMLFormElement>(null)

  const tokenError = fieldError(state, "token")
  const invalid = Boolean(state.error || tokenError)

  return (
    <div className="space-y-4">
      <AuthHeader
        title="Check your email"
        description={
          <>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>. Enter
            it below to finish setting up your account.
          </>
        }
      />

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />

        <FormAlert
          error={state.error ?? resendState.error}
          message={resendState.message}
        />

        <Field data-invalid={invalid}>
          <OtpFields
            invalid={invalid}
            onComplete={() => formRef.current?.requestSubmit()}
          />
          <FieldError className="text-center">{tokenError}</FieldError>
        </Field>

        <SubmitButton pending={pending}>Verify email</SubmitButton>
      </form>

      <div className="flex flex-col items-center gap-1">
        <ResendCodeButton
          formAction={resendAction}
          pending={resendPending}
          email={email}
        />
        <Link
          href="/signup"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Use a different email
        </Link>
      </div>
    </div>
  )
}
