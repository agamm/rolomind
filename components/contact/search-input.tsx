"use client"

import React, { useState, useCallback } from "react"
import { Search, X } from "lucide-react"

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({
  onSearch,
  placeholder = "Filter results by name, email, or notes...",
  disabled = false,
}: SearchInputProps) {
  const [query, setQuery] = useState("")

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      onSearch(value)
    },
    [onSearch],
  )

  const handleClear = useCallback(() => {
    setQuery("")
    onSearch("")
  }, [onSearch])

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
      <input 
        value={query} 
        onChange={handleChange} 
        placeholder={disabled ? "Clear AI results to use search" : placeholder} 
        className="w-full pl-10 pr-12 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed h-11 sm:h-9 touch-manipulation" 
        disabled={disabled}
      />
      {query && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 rounded-md hover:bg-gray-100 transition-colors touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}