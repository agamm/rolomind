"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Pause, Play, Square, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioLevel: number
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  isProcessing?: boolean
  error?: string | null
}

export function VoiceRecorder({
  isRecording,
  isPaused,
  recordingTime,
  audioLevel,
  onStart,
  onStop,
  onPause,
  onResume,
  isProcessing = false,
  error
}: VoiceRecorderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4 border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-blue-600" />
            AI Voice Input
          </h4>
          <p className="text-sm text-gray-600">
            Speak naturally about this contact to update their information
          </p>
        </div>

        {/* Main Recording Button */}
        <Button
          type="button"
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? onStop : onStart}
          disabled={isProcessing}
          className={cn(
            "transition-all duration-200",
            isRecording && "shadow-lg scale-105"
          )}
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="space-y-3">
          {/* Audio Visualizer */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 bg-blue-400 rounded-full transition-all duration-100",
                    i < (audioLevel / 5) ? "bg-blue-600" : "bg-blue-200"
                  )}
                  style={{
                    height: `${Math.max(4, Math.random() * (audioLevel / 2) + 10)}px`,
                  }}
                />
              ))}
            </div>
            
            {/* Timer and Controls */}
            <div className="flex items-center gap-2 ml-4">
              <span className="font-mono text-sm font-medium text-gray-700 min-w-[60px]">
                {formatTime(recordingTime)}
              </span>
              
              {isPaused ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onResume}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onPause}
                  className="h-8 w-8 p-0"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Recording Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
            )} />
            <span className="text-gray-600">
              {isPaused ? "Recording paused" : "Recording in progress..."}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <MicOff className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !error && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click "Start Recording" and describe any updates</p>
          <p>• Examples: "They moved to Austin", "New email is john@company.com"</p>
          <p>• The AI will automatically update the relevant fields</p>
        </div>
      )}
    </div>
  )
}