"use client"

import * as React from "react"

import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api/client"

export function useToastFeedback() {
  const notifySuccess = React.useCallback(
    (title: string, description?: string) => {
      toast.add({ title, description, type: "success" })
    },
    []
  )

  const notifyError = React.useCallback((title: string, error?: unknown) => {
    const description =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : undefined

    toast.add({ title, description, type: "error" })
  }, [])

  const notifyInfo = React.useCallback(
    (title: string, description?: string) => {
      toast.add({ title, description, type: "info" })
    },
    []
  )

  return { notifySuccess, notifyError, notifyInfo }
}
