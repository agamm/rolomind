"use client"

import React from "react"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts } from "@/hooks/use-local-contacts"
import { Contact } from "@/types/contact"
import { MinimalContactsModal } from "./minimal-contacts-modal"
import { findMinimalContacts } from "@/lib/config"
import { deleteContactsBatch } from "@/db/indexdb/contacts"
import { toast } from "sonner"

export function ContactManagerContent() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: contacts = [] } = useContacts(searchQuery)
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  const [isAISearching, setIsAISearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showMinimalContacts, setShowMinimalContacts] = React.useState(false)
  const [minimalContacts, setMinimalContacts] = React.useState<Contact[]>([])

  const handleAiResults = React.useCallback((results: Array<{ contact: Contact; reason: string }>) => {
    setAiResults(results)
  }, [])

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


  return (
    <>
      <AIQuery 
        contacts={contacts} 
        onResults={handleAiResults}
        onSearchingChange={setIsAISearching}
        onProcessingChange={setIsProcessing}
        onReset={() => setAiResults(undefined)}
        onError={() => {
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