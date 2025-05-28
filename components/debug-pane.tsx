"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bug, Trash2 } from "lucide-react"

interface DebugEntry {
  timestamp: string
  type: "raw" | "parsed" | "error" | "state"
  data: unknown
  source?: string
}

interface DebugPaneProps {
  isVisible: boolean
  onToggle: () => void
  entries: DebugEntry[]
  onClear: () => void
  onLogCurrentState?: () => void
}

export function DebugPane({ isVisible, onToggle, entries, onClear }: DebugPaneProps) {
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={onToggle} variant="outline" size="sm" className="shadow-lg">
          <Bug className="w-4 h-4 mr-2" />
          Debug ({entries.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <span className="font-medium">Debug ({entries.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onClear}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 max-h-80 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No debug entries</div>
          ) : (
            <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-2 rounded">
              {entries.map((entry) => 
                `[${entry.timestamp}] ${entry.type.toUpperCase()}${entry.source ? ` (${entry.source})` : ''}: ${
                  typeof entry.data === "string" ? entry.data : JSON.stringify(entry.data, null, 2)
                }\n\n`
              ).join('')}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
