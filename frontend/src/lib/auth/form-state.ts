export interface AuthFormState {
  /** Form-level message, rendered in an Alert above the fields. */
  error?: string
  /** Non-error confirmation, e.g. "A new code is on its way." */
  message?: string
  /** Per-field messages keyed by input name. */
  fieldErrors?: Record<string, string[]>
  /** Values echoed back so a failed submit does not clear the form. */
  values?: Record<string, string>
}

export const emptyAuthFormState: AuthFormState = {}

export function fieldError(state: AuthFormState, name: string) {
  return state.fieldErrors?.[name]?.[0]
}
