"use client"

import {
  AnimatedTableBody,
  AnimatedTableRow,
} from "@/components/motion/animated-list"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import type { Insight, InsightConfidence } from "@/lib/types/metrics"
import { cn } from "@/lib/utils"

const CONFIDENCE_CLASS: Record<InsightConfidence, string> = {
  high: "ring-1 ring-inset bg-status-approved/12 text-status-approved-foreground dark:text-status-approved ring-status-approved/25",
  medium:
    "ring-1 ring-inset bg-status-pending/12 text-status-pending-foreground dark:text-status-pending ring-status-pending/25",
  low: "ring-1 ring-inset bg-muted text-muted-foreground ring-border",
}

export function InsightsTable({ insights }: { insights: Insight[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-4">
        <CardTitle>Recommendations</CardTitle>
        <CardDescription>
          Generated from published performance — each one cites what the data
          showed.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="min-w-40">Subject</TableHead>
                <TableHead className="min-w-64">Finding</TableHead>
                <TableHead className="min-w-64">Recommendation</TableHead>
                <TableHead className="w-28">Confidence</TableHead>
                <TableHead className="w-28">Date</TableHead>
              </TableRow>
            </TableHeader>

            <AnimatedTableBody>
              {insights.map((insight) => (
                <AnimatedTableRow key={insight.id} className="border-b">
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {insight.category.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {insight.subject}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {insight.finding}
                  </TableCell>
                  <TableCell>{insight.recommendation}</TableCell>
                  <TableCell>
                    {insight.confidence && (
                      <Badge
                        className={cn(
                          "capitalize",
                          CONFIDENCE_CLASS[insight.confidence]
                        )}
                      >
                        {insight.confidence}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(insight.createdAt)}
                  </TableCell>
                </AnimatedTableRow>
              ))}
            </AnimatedTableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
