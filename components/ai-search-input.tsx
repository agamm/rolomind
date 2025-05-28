"use client"

import { forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedSearchInput, type EnhancedSearchInputRef } from "@/components/enhanced-search-input"
import { Loader2 } from "lucide-react"

interface AISearchInputProps {
  onSearch: (query: string) => void
  onClear: () => void
  isSearching: boolean
  isLoading: boolean
}

export const AISearchInput = forwardRef<EnhancedSearchInputRef, AISearchInputProps>(function AISearchInput(
  { onSearch, onClear, isSearching, isLoading },
  ref,
) {
  return (
    <Card className="border-purple-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-purple-900">AI Contact Search</h2>
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>

          <EnhancedSearchInput ref={ref} onSearch={onSearch} onClear={onClear} isSearching={isSearching} />
        </div>
      </CardContent>
    </Card>
  )
})
