"use client"

import * as React from "react"
import Link from "next/link"

import { signIn } from "@/lib/auth/actions"
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

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = React.useActionState(
    signIn,
    emptyAuthFormState
  )

  return (
    <div className="space-y-4">
      <AuthHeader
        title="Welcome back"
        description="Sign in to keep your pipeline moving."
      />

      <GoogleButton next={next} />

      <FieldSeparator className="my-1">OR</FieldSeparator>

      <form action={formAction} className="space-y-3">
        {next ? <input type="hidden" name="next" value={next} /> : null}

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

        <Field
          className="gap-1.5"
          data-invalid={Boolean(fieldError(state, "password"))}
        >
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(fieldError(state, "password"))}
            required
          />
          <FieldError>{fieldError(state, "password")}</FieldError>
        </Field>

        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
