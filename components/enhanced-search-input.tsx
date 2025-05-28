"use client"

import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Sparkles, Loader2, X } from "lucide-react"

interface EnhancedSearchInputProps {
  onSearch: (query: string) => void
  onClear: () => void
  isSearching: boolean
  placeholder?: string
}

export interface EnhancedSearchInputRef {
  clear: () => void
}

export const EnhancedSearchInput = React.memo(
  forwardRef<EnhancedSearchInputRef, EnhancedSearchInputProps>(function EnhancedSearchInput(
    { onSearch, onClear, isSearching, placeholder = "Ask AI about your contacts..." },
    ref,
  ) {
    const [query, setQuery] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
          onSearch(query.trim())
        }
      },
      [query, onSearch],
    )

    const handleClear = useCallback(() => {
      setQuery("")
      onClear()
      inputRef.current?.focus()
    }, [onClear])

    // Expose clear method to parent
    useImperativeHandle(
      ref,
      () => ({
        clear: () => setQuery(""),
      }),
      [],
    )

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "/" && e.target !== inputRef.current) {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    return (
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>

          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-20 border-purple-300 bg-purple-50 focus:border-purple-500 focus:ring-purple-500"
            disabled={isSearching}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
          </div>
        </div>
      </form>
    )
  }),
)
