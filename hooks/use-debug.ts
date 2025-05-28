"use client"

import { useState, useCallback } from "react"

interface DebugEntry {
  timestamp: string
  type: "raw" | "parsed" | "error" | "state"
  data: unknown
  source?: string
}

export function useDebug() {
  const [entries, setEntries] = useState<DebugEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const addEntry = useCallback((type: DebugEntry["type"], data: unknown, source?: string) => {
    const entry: DebugEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      data,
      source,
    }
    setEntries(prev => {
      // Keep only the last 100 entries to prevent memory issues
      const newEntries = [...prev, entry]
      if (newEntries.length > 100) {
        return newEntries.slice(-100)
      }
      return newEntries
    })
  }, [])

  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev)
  }, [])

  return {
    entries,
    isVisible,
    addEntry,
    clearEntries,
    toggleVisibility,
  }
}
