"use client"

import * as React from "react"
import Link from "next/link"

import { signUp } from "@/lib/auth/actions"
import { emptyAuthFormState, fieldError } from "@/lib/auth/form-state"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthHeader } from "@/components/auth/auth-header"
import { FormAlert } from "@/components/auth/form-alert"
import { GoogleButton } from "@/components/auth/google-button"
import { PasswordInput } from "@/components/auth/password-input"
import { SubmitButton } from "@/components/auth/submit-button"

export function SignupForm() {
  const [state, formAction, pending] = React.useActionState(
    signUp,
    emptyAuthFormState
  )

  return (
    <div className="space-y-4">
      <AuthHeader
        title="Create your account"
        description="Your whole video pipeline, in one place."
      />

      <GoogleButton label="Sign up with Google" />

      <FieldSeparator className="my-1">OR</FieldSeparator>

      <form action={formAction} className="space-y-3">
        <FormAlert error={state.error} />

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "fullName"))}
        >
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Alex Carter"
            defaultValue={state.values?.fullName}
            aria-invalid={Boolean(fieldError(state, "fullName"))}
            className="h-9"
            required
          />
          <FieldError>{fieldError(state, "fullName")}</FieldError>
        </Field>

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

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "password"))}
        >
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
            placeholder="Re-enter your password"
            aria-invalid={Boolean(fieldError(state, "confirmPassword"))}
            required
          />
          <FieldError>{fieldError(state, "confirmPassword")}</FieldError>
        </Field>

        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
