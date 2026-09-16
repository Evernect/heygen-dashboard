import { z } from "zod"

const email = z.email("Enter a valid email address").trim().min(1, "Email is required")

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")

const otp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email")

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
})

export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(80, "That name is too long"),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const verifyOtpSchema = z.object({
  email,
  token: otp,
})

export const emailOnlySchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    email,
    token: otp,
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
