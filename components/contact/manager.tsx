"use client"

import React from "react"
import { TopNav } from "@/components/layout"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts } from "@/hooks/use-local-contacts"
import { useEnhancedImport } from "@/hooks/use-enhanced-import"
import { useSession } from "@/lib/auth/auth-client"
import { Contact } from "@/types/contact"
import { MergeConfirmationModal } from "@/components/import/merge-confirmation-modal"
import { ImportProgressModal } from "@/components/import/import-progress-modal"
import { OversizedContactsModal } from "@/components/import/oversized-contacts-modal"
import { ImportPreviewDialog } from "@/components/import/import-preview-dialog"

export function ContactManager() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const { isPending: sessionLoading } = useSession()
  const { data: contacts = [], isLoading } = useContacts(searchQuery)
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  const [isAISearching, setIsAISearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const {
    importFile,
    isImporting,
    isSaving,
    currentDuplicate,
    duplicatesCount,
    handleDuplicateDecision,
    importProgress,
    cancelImport,
    oversizedContacts,
    handleOversizedDecision,
    continueImportAfterPreview
  } = useEnhancedImport()

  const handleAiResults = React.useCallback((results: Array<{ contact: Contact; reason: string }>) => {
    setAiResults(results)
  }, [])

  const handleFileSelect = async (file: File) => {
    importFile(file)
  }


  // Show loading state while session is loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col gap-6">
            <TopNav
              contactCount={0}
              onFileSelect={handleFileSelect}
              isImporting={false}
              disabled={true}
            />
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium mb-2">Loading your account...</div>
              <p className="text-gray-600">Please wait while we initialize your session</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">
          <TopNav
            contactCount={contacts.length}
            onFileSelect={handleFileSelect}
            isImporting={isImporting || isSaving}
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
                onSearchingChange={setIsAISearching}
                onProcessingChange={setIsProcessing}
                onReset={() => setAiResults(undefined)}
              />
              <ContactList
                contacts={contacts}
                aiResults={aiResults}
                isAISearching={isAISearching || isProcessing}
                onSearch={setSearchQuery}
                onResetAISearch={() => setAiResults(undefined)}
              />
            </>
          )}
        </div>
      </div>
      
      <ImportProgressModal
        isOpen={importProgress.status !== 'idle' && importProgress.status !== 'resolving' && importProgress.status !== 'preview'}
        status={importProgress.status === 'idle' || importProgress.status === 'resolving' ? 'detecting' : importProgress.status}
        parserType={importProgress.parserType}
        progress={importProgress.progress}
        error={importProgress.error}
        onClose={cancelImport}
      />
      
      <ImportPreviewDialog
        isOpen={importProgress.status === 'preview'}
        onClose={cancelImport}
        onConfirm={continueImportAfterPreview}
        csvHeaders={importProgress.csvHeaders || []}
        sampleRow={importProgress.sampleRow}
        parserType={importProgress.parserType || 'custom'}
        rowCount={importProgress.rowCount}
      />
      
      <MergeConfirmationModal
        duplicate={currentDuplicate}
        onDecision={handleDuplicateDecision}
        remainingCount={duplicatesCount - 1}
        mergeProgress={importProgress.mergeProgress}
      />
      
      <OversizedContactsModal
        isOpen={oversizedContacts.length > 0}
        oversizedContacts={oversizedContacts}
        onDecision={handleOversizedDecision}
      />
    </div>
  )
}