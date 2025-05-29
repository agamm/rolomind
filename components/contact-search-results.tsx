"use client"

import React, { useMemo } from "react"
import type { Contact } from "@/types/contact"
import { SimplifiedContactCard } from "@/components/simplified-contact-card"
import { PaginationControls } from "@/components/pagination-controls"
import { RegularSearchInput } from "@/components/regular-search-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X, Upload, Sparkles } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"

interface ContactSearchResultsProps {
  contacts: Contact[]
  aiFilteredContacts: Contact[]
  isAiSearch: boolean
  isSearching: boolean
  query: string
  onRegularSearch: (query: string) => void
  onReset: () => void
  onDeleteContact: (id: string) => void
  getAiReason: (id: string) => string | undefined
  getFinalSummary: () => string | null
  hasSummary: () => boolean
}

export function ContactSearchResults({
  contacts,
  aiFilteredContacts,
  isAiSearch,
  isSearching,
  query,
  onRegularSearch,
  onReset,
  onDeleteContact,
  getAiReason,
  getFinalSummary,
  hasSummary,
}: ContactSearchResultsProps) {
  const [regularSearchQuery, setRegularSearchQuery] = React.useState("")

  // Apply regular search filter
  const displayContacts = useMemo(() => {
    if (!regularSearchQuery.trim()) {
      return aiFilteredContacts
    }

    const query = regularSearchQuery.toLowerCase()
    return aiFilteredContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.contactInfo.emails.some((email) => email.toLowerCase().includes(query)) ||
        contact.notes.toLowerCase().includes(query),
    )
  }, [aiFilteredContacts, regularSearchQuery])

  // Paginate the display contacts
  const {
    paginatedItems: paginatedContacts,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination(displayContacts, 24)

  const handleRegularSearch = React.useCallback(
    (query: string) => {
      setRegularSearchQuery(query)
      onRegularSearch(query)
    },
    [onRegularSearch],
  )

  // Determine what to show
  const showLoading = isSearching && displayContacts.length === 0
  const showEmpty = !isSearching && displayContacts.length === 0
  const showContacts = displayContacts.length > 0

  // Debug info
  console.log("ContactSearchResults render:", {
    isAiSearch,
    isSearching,
    aiFilteredContactsCount: aiFilteredContacts.length,
    displayContactsCount: displayContacts.length,
    showLoading,
    showEmpty,
    showContacts
  })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {isAiSearch ? (
                  <>
                    AI Search Results ({aiFilteredContacts.length})
                  </>
                ) : (
                  <>All Contacts ({contacts.length})</>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-64">
                <RegularSearchInput onSearch={handleRegularSearch} />
              </div>

              {isAiSearch && (
                <Button variant="outline" size="sm" onClick={onReset} className="text-gray-600">
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Query Display */}
          {isAiSearch && query && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Query:</div>
              <div className="font-medium text-gray-900">&quot;{query}&quot;</div>
            </div>
          )}

          {/* Progress indicator */}
          {isSearching && (
            <div className="bg-purple-50 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <div className="text-sm text-purple-800">
                Searching contacts... {displayContacts.length > 0 && `Found ${displayContacts.length} matches so far.`}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {isAiSearch && hasSummary() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-blue-900">AI Summary</h3>
              </div>
              {getFinalSummary() ? (
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{getFinalSummary()}</p>
              ) : (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Generating summary...</span>
                </div>
              )}
            </div>
          )}

          {/* Main content area */}
          {showLoading && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-lg font-medium text-gray-900">Searching contacts...</div>
              </div>
            </div>
          )}

          {showEmpty && (
            <div className="text-center py-12">
              {isAiSearch ? (
                <div className="text-gray-500">
                  <div className="text-lg font-medium mb-2">No matches found</div>
                  <p>Try adjusting your search or using different terms</p>
                </div>
              ) : contacts.length > 0 ? (
                <div className="text-gray-500">
                  <div className="text-lg font-medium mb-2">No contacts to display</div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <div className="text-lg font-medium mb-2">No contacts yet</div>
                  <p>Import a CSV file to get started!</p>
                </div>
              )}
            </div>
          )}

          {showContacts && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedContacts.map((contact) => (
                  <SimplifiedContactCard
                    key={contact.id}
                    contact={contact}
                    onDelete={onDeleteContact}
                    isAiResult={isAiSearch}
                    aiReason={getAiReason(contact.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPrevPage={prevPage}
                  onNextPage={nextPage}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
