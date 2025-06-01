"use client"

import React from "react"
import { toast } from "sonner"
import { TopNav } from "@/components/layout"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts, useDeleteAllContacts } from "@/hooks/use-contacts-api"
import { useEnhancedImport } from "@/hooks/use-enhanced-import"
import { Contact } from "@/types/contact"
import { MergeConfirmationModal } from "@/components/import/merge-confirmation-modal"
import { ImportProgressModal } from "@/components/import/import-progress-modal"

export function ContactManager() {
  const { data: contacts = [], isLoading, error, refetch } = useContacts()
  const deleteAllMutation = useDeleteAllContacts()
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  
  const {
    importFile,
    isImporting,
    isSaving,
    currentDuplicate,
    duplicatesCount,
    handleDuplicateDecision,
    importProgress,
    cancelImport
  } = useEnhancedImport(() => refetch())

  const handleAiResults = React.useCallback((results: Array<{ contact: Contact; reason: string }>) => {
    setAiResults(results)
  }, [])

  const handleFileSelect = async (file: File) => {
    importFile(file)
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllMutation.mutateAsync()
      toast.success("All contacts deleted successfully")
    } catch (error) {
      console.error("Failed to delete all contacts:", error)
      toast.error(`Failed to delete contacts: ${error instanceof Error ? error.message : "Please try again."}`)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading contacts</h1>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">
          <TopNav
            contactCount={contacts.length}
            onFileSelect={handleFileSelect}
            onDeleteAll={handleDeleteAll}
            isImporting={isImporting || isSaving}
            isDeleting={deleteAllMutation.isPending}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">Loading contacts...</div>
            </div>
          ) : (
            <>
              <AIQuery 
                contacts={contacts} 
                onResults={handleAiResults}
              />
              <ContactList
                contacts={contacts}
                aiResults={aiResults}
              />
            </>
          )}
        </div>
      </div>
      
      <ImportProgressModal
        isOpen={importProgress.status !== 'idle' && importProgress.status !== 'resolving'}
        status={importProgress.status === 'idle' || importProgress.status === 'resolving' ? 'detecting' : importProgress.status}
        parserType={importProgress.parserType}
        progress={importProgress.progress}
        error={importProgress.error}
        onCancel={cancelImport}
      />
      
      <MergeConfirmationModal
        duplicate={currentDuplicate}
        onDecision={handleDuplicateDecision}
        remainingCount={duplicatesCount - 1}
      />
    </div>
  )
}