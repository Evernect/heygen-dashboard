"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useCooldown } from "@/hooks/use-cooldown"

const COOLDOWN_SECONDS = 60

export function ResendCodeButton({
  formAction,
  pending,
  email,
}: {
  formAction: (formData: FormData) => void
  pending: boolean
  email: string
}) {
  const { seconds, isCoolingDown, start } = useCooldown(COOLDOWN_SECONDS)

  return (
    <form action={formAction} onSubmit={() => start(COOLDOWN_SECONDS)}>
      <input type="hidden" name="email" value={email} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending || isCoolingDown || !email}
        className="text-muted-foreground hover:text-foreground"
      >
        {pending ? <Spinner /> : null}
        {isCoolingDown ? `Resend code in ${seconds}s` : "Resend code"}
      </Button>
    </form>
  )
}
