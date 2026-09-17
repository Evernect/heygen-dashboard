"use client"

import { SheetImportDialog } from "@/components/shared/sheet-import-dialog"
import { bulkCreateTopics } from "@/lib/api/topics"
import {
  parseTopicsFile,
  type ParsedTopicRow,
} from "@/lib/utils/parse-topics-file"

export function BulkImportTopicsDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  return (
    <SheetImportDialog<ParsedTopicRow>
      open={open}
      onOpenChange={onOpenChange}
      title="Import topics"
      noun="topic"
      description={
        <>
          Upload a CSV or Excel file with{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
            issue
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
            angle
          </code>{" "}
          columns as the header row.
        </>
      }
      requiredColumns={["issue", "angle"]}
      columns={[
        { label: "Issue", render: (row) => row.issue },
        { label: "Angle", render: (row) => row.angle, className: "max-w-64" },
      ]}
      parse={parseTopicsFile}
      submit={async (rows) => {
        const { created } = await bulkCreateTopics(
          rows.map((row) => ({ issue: row.issue, angle: row.angle }))
        )
        return created.length
      }}
      onImported={onImported}
    />
  )
}
