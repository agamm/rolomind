"use client"

import React from "react"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts } from "@/hooks/use-local-contacts"
import { Contact } from "@/types/contact"
import { ContactLimitWarning } from "@/components/contact-limit-warning"
import { findEmptyContacts, findMinimalContacts, findContactsWithoutNotes } from "@/lib/contact-limits"
import { MinimalContactsModal } from "./minimal-contacts-modal"
import { deleteContactsBatch } from "@/db/indexdb/contacts"
import { toast } from "sonner"

export function ContactManagerContent() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: contacts = [], isLoading, error } = useContacts(searchQuery)
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  const [isAISearching, setIsAISearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showMinimalContacts, setShowMinimalContacts] = React.useState(false)
  const [minimalContacts, setMinimalContacts] = React.useState<Contact[]>([])

  const handleAiResults = React.useCallback((results: Array<{ contact: Contact; reason: string }>) => {
    setAiResults(results)
  }, [])

  const handleSearchEmpty = React.useCallback(() => {
    // Find empty contacts and set them as AI results
    const emptyContacts = findEmptyContacts(contacts);
    const emptyResults = emptyContacts.map(contact => ({
      contact,
      reason: 'Empty contact with no information'
    }));
    setAiResults(emptyResults);
    setSearchQuery(''); // Clear text search to show all
  }, [contacts]);

  const handleSearchMinimal = React.useCallback(() => {
    // Find minimal contacts and show them in modal
    const minimal = findMinimalContacts(contacts);
    setMinimalContacts(minimal);
    setShowMinimalContacts(true);
  }, [contacts]);

  // Update minimal contacts when contacts change and modal is open
  React.useEffect(() => {
    if (showMinimalContacts) {
      const minimal = findMinimalContacts(contacts);
      setMinimalContacts(minimal);
      // Close modal if no more minimal contacts
      if (minimal.length === 0) {
        setShowMinimalContacts(false);
        toast.info('All minimal contacts have been deleted');
      }
    }
  }, [contacts, showMinimalContacts]);

  const handleSearchWithoutNotes = React.useCallback(() => {
    // Find contacts without notes and set them as AI results
    const contactsWithoutNotes = findContactsWithoutNotes(contacts);
    const results = contactsWithoutNotes.map(contact => ({
      contact,
      reason: 'Contact without notes'
    }));
    setAiResults(results);
    setSearchQuery(''); // Clear text search to show all
  }, [contacts]);

  const handleDeleteMinimalContacts = React.useCallback(async (contactIds: string[]) => {
    try {
      await deleteContactsBatch(contactIds);
      toast.success(`Deleted ${contactIds.length} contact${contactIds.length > 1 ? 's' : ''}`);
      
      // Small delay to ensure database updates are propagated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear AI results if they were showing deleted contacts
      if (aiResults) {
        const remainingResults = aiResults.filter(
          result => !contactIds.includes(result.contact.id)
        );
        if (remainingResults.length < aiResults.length) {
          setAiResults(remainingResults.length > 0 ? remainingResults : undefined);
        }
      }
      
      // Don't close modal immediately - let the effect handle it
      // This ensures the list updates properly
    } catch (error) {
      toast.error('Failed to delete contacts');
      console.error('Delete error:', error);
    }
  }, [aiResults]);

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading contacts</h1>
        <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading contacts...</div>
      </div>
    )
  }

  return (
    <>
      <ContactLimitWarning 
        contacts={contacts}
        onSearchEmpty={handleSearchEmpty}
        onSearchMinimal={handleSearchMinimal}
        onSearchWithoutNotes={handleSearchWithoutNotes}
      />
      <AIQuery 
        contacts={contacts} 
        onResults={handleAiResults}
        onSearchingChange={setIsAISearching}
        onProcessingChange={setIsProcessing}
        onReset={() => setAiResults(undefined)}
        onError={(error) => {
          // Force stop searching state on error
          setIsAISearching(false)
          setIsProcessing(false)
        }}
      />
      <ContactList
        contacts={contacts}
        aiResults={aiResults}
        isAISearching={isAISearching || isProcessing}
        onSearch={setSearchQuery}
        onResetAISearch={() => setAiResults(undefined)}
      />
      <MinimalContactsModal
        isOpen={showMinimalContacts}
        onClose={() => setShowMinimalContacts(false)}
        contacts={minimalContacts}
        onDelete={handleDeleteMinimalContacts}
      />
    </>
  )
}