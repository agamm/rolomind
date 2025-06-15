"use client"

import React, { useState } from "react"
import type { Contact } from "@/types/contact"
import { ContactCard } from "./card"
import { SearchInput } from "./search-input"
import { EditContactModal } from "./edit-modal"
import { BulkEditModal } from "./bulk-edit-modal"
import { PaginationControls } from "@/components/pagination-controls"
import { DeleteConfirmationDialog } from "@/components/delete/delete-confirmation-dialog"
import { BulkDeleteDialog } from "@/components/delete/bulk-delete-dialog"
import { Upload, Edit3, CheckSquare, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/use-pagination"
import { toast } from "sonner"
import { useUpdateContact, useDeleteContact } from "@/hooks/use-local-contacts"
import { ExportQueryButton } from "@/components/export/export-query-button"
import { deleteContactsBatch } from "@/db/local/contacts"

interface ContactListProps {
  contacts: Contact[]
  onSearch?: (query: string) => void
  aiResults?: Array<{ contact: Contact; reason: string }>
  isAISearching?: boolean
  loadingMessage?: string
  onResetAISearch?: () => void
}

export function ContactList({ contacts, onSearch, aiResults, isAISearching, onResetAISearch }: ContactListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [showCheckboxes, setShowCheckboxes] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  const updateContactMutation = useUpdateContact()
  const deleteContactMutation = useDeleteContact()

  const handleUpdateContact = async (updatedContact: Contact) => {
    try {
      await updateContactMutation.mutateAsync(updatedContact)
      toast.success('Contact updated successfully')
      setEditingContact(null)
    } catch (error) {
      toast.error('Failed to update contact')
      console.error('Update error:', error)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContactMutation.mutateAsync(contactId)
      toast.success('Contact deleted successfully')
      setDeletingContact(null)
    } catch (error) {
      toast.error('Failed to delete contact')
      console.error('Delete error:', error)
    }
  }

  const handleBulkDelete = async (contactIds: string[]) => {
    setIsBulkDeleting(true)
    try {
      await deleteContactsBatch(contactIds)
      toast.success(`Deleted ${contactIds.length} contacts`)
      setSelectedContacts(new Set())
      setShowCheckboxes(false)
      setShowBulkDelete(false)
    } catch (error) {
      toast.error('Failed to delete contacts')
      console.error('Bulk delete error:', error)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Check if AI search was performed but returned no results
  const hasAISearchNoResults = aiResults !== undefined && aiResults.length === 0 && !isAISearching

  const filteredContacts = React.useMemo(() => {
    // If AI search returned no results, don't show any contacts
    if (hasAISearchNoResults) return []
    
    // Start with either AI results or all contacts
    const baseContacts = aiResults && aiResults.length > 0 
      ? aiResults.map(result => result.contact)
      : contacts
    
    // Apply search filter if there's a query
    if (!searchQuery.trim()) return baseContacts
    
    const query = searchQuery.toLowerCase()
    return baseContacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.contactInfo.emails.some(email => email.toLowerCase().includes(query)) ||
      contact.notes.toLowerCase().includes(query)
    )
  }, [contacts, searchQuery, aiResults, hasAISearchNoResults])

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
    goToPage(1) // Reset to first page when searching
    if (onSearch) onSearch(query)
  }

  const handleSelectToggle = (contact: Contact) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contact.id)) {
      newSelected.delete(contact.id)
    } else {
      newSelected.add(contact.id)
    }
    setSelectedContacts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  const selectedContactsArray = contacts.filter(c => selectedContacts.has(c.id))

  return (
    <div className="contact-list-container">
      <div className="p-8">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                {aiResults && aiResults.length > 0 ? 'AI Search Results' : 'All Contacts'} ({filteredContacts.length})
                {aiResults && aiResults.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    {isAISearching ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    )}
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-3">
                {filteredContacts.length > 0 && !showCheckboxes && (
                  <div className="flex items-center gap-2">
                    <ExportQueryButton contacts={filteredContacts} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCheckboxes(!showCheckboxes)
                        if (showCheckboxes) {
                          setSelectedContacts(new Set())
                        }
                      }}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Select to Edit
                    </Button>
                  </div>
                )}
                
                {showCheckboxes && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCheckboxes(false)
                        setSelectedContacts(new Set())
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedContacts.size === filteredContacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                )}
                
                <div className="w-full sm:w-64">
                  <SearchInput onSearch={handleSearch} disabled={false} />
                </div>
              </div>
            </div>
            
            {/* Selection actions row */}
            {showCheckboxes && selectedContacts.size > 0 && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 flex-wrap">
                  <ExportQueryButton contacts={selectedContactsArray} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBulkEdit(true)
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit ({selectedContacts.size})
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBulkDelete(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedContacts.size})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Status message when still searching/processing */}
          {isAISearching && aiResults && aiResults.length > 0 && (
            <div className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-2 self-start">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span>
                Still searching • Results will be sorted when complete
              </span>
            </div>
          )}

          {/* Main content area */}
          {isAISearching && (!aiResults || aiResults.length === 0) ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-lg font-medium mb-2">
                  AI Search in Progress
                </div>
                <p>
                  {aiResults && aiResults.length > 0 ? 'Sorting and organizing results...' : 'Processing contacts in batches...'}
                </p>
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {hasAISearchNoResults ? (
                  <>
                    <X className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <div className="text-lg font-medium mb-2">
                      No contacts found matching AI search
                    </div>
                    <p className="mb-4">
                      Try a different search query or reset to view all contacts
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => onResetAISearch?.()}
                      className="mx-auto"
                    >
                      Reset to All Contacts
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <div className="text-lg font-medium mb-2">
                      {contacts.length === 0 ? "No contacts yet" : "No matches found"}
                    </div>
                    <p>
                      {contacts.length === 0 ? "Import a CSV file to get started!" : "Try a different search term"}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedContacts.map((contact, index) => {
                  const aiResult = aiResults?.find(result => result.contact.id === contact.id)
                  return (
                    <div 
                      key={contact.id}
                      className={aiResults ? 'contact-card-animated' : ''}
                      style={{ 
                        animationDelay: aiResults ? `${index * 0.08}s` : '0s' 
                      }}
                    >
                      <ContactCard
                        contact={contact}
                        aiReason={aiResult?.reason}
                        onEdit={setEditingContact}
                        onDelete={setDeletingContact}
                        showCheckbox={showCheckboxes}
                        isSelected={selectedContacts.has(contact.id)}
                        onSelectToggle={handleSelectToggle}
                      />
                    </div>
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
      </div>
      
      <EditContactModal
        contact={editingContact}
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSave={handleUpdateContact}
        onDelete={setDeletingContact}
      />
      
      <BulkEditModal
        contacts={selectedContactsArray}
        isOpen={showBulkEdit}
        onClose={() => {
          setShowBulkEdit(false)
          setSelectedContacts(new Set())
          setShowCheckboxes(false)
        }}
        onSave={handleUpdateContact}
        onDelete={setDeletingContact}
      />
      
      <DeleteConfirmationDialog
        isOpen={!!deletingContact}
        contact={deletingContact}
        onConfirm={() => deletingContact && handleDeleteContact(deletingContact.id)}
        onCancel={() => setDeletingContact(null)}
        isDeleting={false}
      />
      
      <BulkDeleteDialog
        isOpen={showBulkDelete}
        count={selectedContacts.size}
        onConfirm={() => handleBulkDelete(Array.from(selectedContacts))}
        onCancel={() => setShowBulkDelete(false)}
        isDeleting={isBulkDeleting}
      />
    </div>
  )
}