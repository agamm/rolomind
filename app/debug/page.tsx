"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, TestTube, CheckCircle, XCircle } from "lucide-react"
import { useJsonStream } from "@/hooks/use-json-stream"

interface NumberData {
  number: number
}

export default function DebugPage() {
  const { data: numbers, isLoading, error, start } = useJsonStream<NumberData>()

  const handleTest = () => {
    start('/api/debug-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Stream Numbers Debug</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Number Streaming</h2>
          <p className="text-gray-600 mb-4">
            This tests streaming numbers 1-10 using NDJSON format without AI SDK.
          </p>
          
          <div className="flex gap-3 mb-4">
            <Button 
              onClick={handleTest}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Streaming Numbers...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Start Number Stream
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error occurred:</span>
              </div>
              <p className="text-red-700 mt-1">{error.message}</p>
            </div>
          )}

          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <div>
                  <p className="font-medium text-blue-900">Streaming numbers...</p>
                  <p className="text-sm text-blue-700">Generating numbers 1-10</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {numbers.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Streamed Numbers ({numbers.length})</h3>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {numbers.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center"
                >
                  <span className="text-2xl font-bold text-blue-600">{item.number}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Debug Info</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>Status: <span className={isLoading ? 'text-blue-600' : 'text-green-600'}>
              {isLoading ? 'STREAMING' : 'IDLE'}
            </span></div>
            <div>Numbers Count: <span className="text-blue-600">
              {numbers.length}
            </span></div>
            <div>Error: <span className={error ? 'text-red-600' : 'text-green-600'}>
              {error ? 'YES' : 'NO'}
            </span></div>
          </div>
        </Card>
      </div>
    </div>
  )
}