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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3 border border-blue-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-blue-600" />
          <div>
            <span className="text-sm font-medium text-gray-700">AI Voice</span>
            <span className="text-xs text-gray-500 ml-2">Updates fields automatically</span>
          </div>
        </div>

        {/* Main Recording Button */}
        <Button
          type="button"
          size="sm"
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? onStop : onStart}
          disabled={isProcessing}
          className={cn(
            "transition-all duration-200",
            isRecording && "shadow-md"
          )}
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing
            </>
          ) : isRecording ? (
            <>
              <Square className="mr-2 h-3 w-3" />
              Stop
            </>
          ) : (
            <>
              <Mic className="mr-2 h-3 w-3" />
              Record
            </>
          )}
        </Button>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="space-y-2">
          {/* Audio Visualizer */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
            )} />
            <div className="flex items-center gap-0.5 flex-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-0.5 bg-blue-400 rounded-full transition-all duration-100",
                    i < (audioLevel / 3.5) ? "bg-blue-600" : "bg-blue-200"
                  )}
                  style={{
                    height: `${Math.max(2, Math.random() * (audioLevel / 3) + 6)}px`,
                  }}
                />
              ))}
            </div>
            
            <span className="font-mono text-xs text-gray-600 ml-2">
              {formatTime(recordingTime)}
            </span>
            
            {isPaused ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResume}
                className="h-6 w-6 p-0"
              >
                <Play className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPause}
                className="h-6 w-6 p-0"
              >
                <Pause className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <MicOff className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}