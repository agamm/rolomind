"use client"

import React from "react"
import { ContactList } from "./list"
import { AIQuery } from "./ai-query"
import { useContacts } from "@/hooks/use-local-contacts"
import { useEnhancedImport } from "@/hooks/use-enhanced-import"
import { Contact } from "@/types/contact"
import { MergeConfirmationModal } from "@/components/import/merge-confirmation-modal"
import { ImportProgressModal } from "@/components/import/import-progress-modal"
import { OversizedContactsModal } from "@/components/import/oversized-contacts-modal"
import { ImportPreviewDialog } from "@/components/import/import-preview-dialog"

export function ContactManager() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const { data: contacts = [] } = useContacts(searchQuery)
  const [aiResults, setAiResults] = React.useState<Array<{ contact: Contact; reason: string }> | undefined>()
  const [isAISearching, setIsAISearching] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  const {
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

  return (
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
    </>
  )
}