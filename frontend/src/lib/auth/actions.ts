"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  emailOnlySchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyOtpSchema,
} from "@/lib/auth/schemas"
import type { AuthFormState } from "@/lib/auth/form-state"
import { DEFAULT_SIGNED_IN_ROUTE, safeRedirectPath } from "@/lib/auth/routes"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

const NOT_CONFIGURED: AuthFormState = {
  error:
    "Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local, then restart the dev server.",
}

function invalid(error: z.ZodError, values: Record<string, string>) {
  return {
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    values,
  } satisfies AuthFormState
}

function text(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value : ""
}

async function getOrigin() {
  const headerList = await headers()
  const forwardedHost = headerList.get("x-forwarded-host")
  const host = forwardedHost ?? headerList.get("host")
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https")

  return `${protocol}://${host}`
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = signInSchema.safeParse({
    email: values.email,
    password: text(formData, "password"),
  })

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: "Invalid email or password.", values }
  }

  revalidatePath("/", "layout")
  redirect(safeRedirectPath(text(formData, "next")))
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = {
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
  }
  const parsed = signUpSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  })

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  })

  if (error) return { error: error.message, values }

  if (data.session) {
    revalidatePath("/", "layout")
    redirect(DEFAULT_SIGNED_IN_ROUTE)
  }

  redirect(`/verify-otp?email=${encodeURIComponent(parsed.data.email)}`)
}

export async function verifyEmailOtp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = verifyOtpSchema.safeParse({
    email: values.email,
    token: text(formData, "token"),
  })

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "signup",
  })

  if (error) {
    return {
      error: "That code is incorrect or has expired. Request a new one.",
      values,
    }
  }

  revalidatePath("/", "layout")
  redirect(DEFAULT_SIGNED_IN_ROUTE)
}

export async function resendSignUpOtp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = emailOnlySchema.safeParse(values)

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
  })

  if (error) return { error: error.message, values }

  return { message: "A new code is on its way.", values }
}

export async function signInWithGoogle(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const supabase = await createClient()
  const origin = await getOrigin()
  const next = safeRedirectPath(text(formData, "next"))

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    return { error: "Could not reach Google. Try again in a moment." }
  }

  redirect(data.url)
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = emailOnlySchema.safeParse(values)

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const origin = await getOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/reset-password` }
  )

  if (error) return { error: error.message, values }

  redirect(`/reset-password?email=${encodeURIComponent(parsed.data.email)}`)
}

export async function confirmPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = resetPasswordSchema.safeParse({
    email: values.email,
    token: text(formData, "token"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  })

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "recovery",
  })

  if (verifyError) {
    return {
      error: "That code is incorrect or has expired. Request a new one.",
      values,
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (updateError) return { error: updateError.message, values }

  revalidatePath("/", "layout")
  redirect(DEFAULT_SIGNED_IN_ROUTE)
}

export async function resendPasswordResetOtp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED

  const values = { email: text(formData, "email") }
  const parsed = emailOnlySchema.safeParse(values)

  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const origin = await getOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${origin}/reset-password` }
  )

  if (error) return { error: error.message, values }

  return { message: "A new code is on its way.", values }
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  revalidatePath("/", "layout")
  redirect("/login")
}
