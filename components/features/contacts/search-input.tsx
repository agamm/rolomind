"use client"

import React, { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function SearchInput({
  onSearch,
  placeholder = "Filter results by name, email, or notes...",
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
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input value={query} onChange={handleChange} placeholder={placeholder} className="pl-10 pr-8 text-sm" />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}