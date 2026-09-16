"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function OtpFields({
  invalid,
  onComplete,
  autoFocus = true,
}: {
  invalid?: boolean
  onComplete?: (value: string) => void
  autoFocus?: boolean
}) {
  return (
    <InputOTP
      id="token"
      name="token"
      maxLength={6}
      autoFocus={autoFocus}
      onComplete={onComplete}
      containerClassName="justify-center"
      aria-invalid={invalid}
    >
      <InputOTPGroup>
        {[0, 1, 2].map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid}
            className="size-11 text-base"
          />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        {[3, 4, 5].map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid}
            className="size-11 text-base"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
