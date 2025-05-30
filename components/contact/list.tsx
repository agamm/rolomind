"use client"

import React from "react"
import type { Contact } from "@/types/contact"
import { ContactCard } from "./card"
import { SearchInput } from "./search-input"
import { PaginationControls } from "@/components/pagination-controls"
import { Card, CardContent } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"

interface ContactListProps {
  contacts: Contact[]
  onSearch: (query: string) => void
  aiResults?: Array<{ contact: Contact; reason: string }>
}

export function ContactList({ contacts, onSearch, aiResults }: ContactListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredContacts = React.useMemo(() => {
    // If we have AI results, show those instead of all contacts
    if (aiResults && aiResults.length > 0) {
      return aiResults.map(result => result.contact)
    }
    
    if (!searchQuery.trim()) return contacts
    
    const query = searchQuery.toLowerCase()
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.contactInfo.emails.some(email => email.toLowerCase().includes(query)) ||
      contact.notes.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery, aiResults])

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
              {aiResults && aiResults.length > 0 ? 'AI Search Results' : 'All Contacts'} ({filteredContacts.length})
            </h3>
            <div className="w-64">
              <SearchInput onSearch={handleSearch} disabled={aiResults && aiResults.length > 0} />
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
                {paginatedContacts.map((contact) => {
                  const aiResult = aiResults?.find(result => result.contact.id === contact.id)
                  return (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      aiReason={aiResult?.reason}
                    />
                  )
                })}
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