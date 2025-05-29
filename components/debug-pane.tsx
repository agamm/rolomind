"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bug, X, Trash2 } from "lucide-react"

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
}

export function DebugPane({ isVisible, onToggle, entries, onClear }: DebugPaneProps) {
  // Filter to only show server messages
  const serverEntries = entries.filter(entry => entry.source === "server" && entry.type === "raw")

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Debug Panel"
      >
        <Bug className="w-5 h-5" />
        {serverEntries.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {serverEntries.length}
          </span>
        )}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <Card className="fixed bottom-20 right-4 w-96 max-h-96 z-40 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Server Stream ({serverEntries.length})
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onToggle}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {serverEntries.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">No server messages yet</div>
              ) : (
                serverEntries.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
                    <div className="text-gray-500 mb-1">[{entry.timestamp}]</div>
                    <div className="text-gray-800">{String(entry.data)}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
