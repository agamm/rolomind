"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useJsonStream } from "@/hooks/use-json-stream"

export default function DebugPage() {
  const { data: greetings, isLoading, error, start } = useJsonStream<string>()

  const handleTest = () => {
    start('/api/debug-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button onClick={handleTest} disabled={isLoading} className="mb-6">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          'Generate Greetings'
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-700">{error.message}</p>
        </div>
      )}

      <div className="text-sm">
        {greetings.map((greeting, index) => (
          <span key={index} className="mr-4">
            {greeting}
          </span>
        ))}
      </div>
    </div>
  )
}