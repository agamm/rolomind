"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Search, RotateCcw } from "lucide-react"

interface SearchResultsHeaderProps {
  query: string
  isAISearch: boolean
  totalResults: number
  onReset: () => void
}

export const SearchResultsHeader = React.memo(function SearchResultsHeader({
  query,
  isAISearch,
  totalResults,
  onReset,
}: SearchResultsHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Search Query Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isAISearch ? (
              <Sparkles className="w-5 h-5 text-purple-600" />
            ) : (
              <Search className="w-5 h-5 text-blue-600" />
            )}
            <h3 className="font-medium text-gray-900">{isAISearch ? "AI Search Results" : "Search Results"}</h3>
          </div>

          <Badge variant={isAISearch ? "default" : "secondary"} className="text-xs">
            {totalResults} {totalResults === 1 ? "contact" : "contacts"}
          </Badge>
        </div>

        <Button variant="outline" size="sm" onClick={onReset} className="text-gray-600">
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Query Display */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Query:</div>
        <div className="font-medium text-gray-900">"{query}"</div>
      </div>
    </div>
  )
})
