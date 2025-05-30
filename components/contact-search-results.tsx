"use client"

import React from "react"
import type { Contact } from "@/types/contact"
import { SimplifiedContactCard } from "@/components/simplified-contact-card"
import { PaginationControls } from "@/components/pagination-controls"
import { RegularSearchInput } from "@/components/regular-search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"

interface ContactSearchResultsProps {
  contacts: Contact[]
  onSearch: (query: string) => void
}

export function ContactSearchResults({
  contacts,
  onSearch,
}: ContactSearchResultsProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim()) return contacts
    
    const query = searchQuery.toLowerCase()
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.contactInfo.emails.some(email => email.toLowerCase().includes(query)) ||
      contact.notes.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery])

  const {
    paginatedItems: paginatedContacts,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination(filteredContacts, 24)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              All Contacts ({filteredContacts.length})
            </h3>
            <div className="w-64">
              <RegularSearchInput onSearch={handleSearch} />
            </div>
          </div>

          {/* Main content area */}
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <div className="text-lg font-medium mb-2">
                  {contacts.length === 0 ? "No contacts yet" : "No matches found"}
                </div>
                <p>
                  {contacts.length === 0 ? "Import a CSV file to get started!" : "Try a different search term"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedContacts.map((contact) => (
                  <SimplifiedContactCard
                    key={contact.id}
                    contact={contact}
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
