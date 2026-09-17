export interface AuthFormState {
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

export const emptyAuthFormState: AuthFormState = {}

export function fieldError(state: AuthFormState, name: string) {
  return state.fieldErrors?.[name]?.[0]
}
