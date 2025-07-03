"use client";

import React from "react";
import { TopNav } from "@/components/layout";
import { ApiKeysWarning } from "@/components/layout/api-keys-warning";
import { useContacts } from "@/hooks/use-local-contacts";
import { useEnhancedImport } from "@/hooks/use-enhanced-import";
import { MergeConfirmationModal } from "@/components/import/merge-confirmation-modal";
import { ImportProgressModal } from "@/components/import/import-progress-modal";
import { ImportPreviewDialog } from "@/components/import/import-preview-dialog";

interface DashboardContentProps {
  children: React.ReactNode;
}

export function DashboardContent({ children }: DashboardContentProps) {
  const { data: contacts = [], isLoading } = useContacts("");
  
  const {
    importFile,
    isImporting,
    isSaving,
    currentDuplicate,
    duplicatesCount,
    handleDuplicateDecision,
    importProgress,
    cancelImport,
    continueImportAfterPreview
  } = useEnhancedImport();

  const handleFileSelect = async (file: File) => {
    importFile(file);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col gap-6">
            <TopNav
              contactCount={contacts.length}
              onFileSelect={handleFileSelect}
              isImporting={isImporting || isSaving}
              disabled={isLoading}
            />
            <ApiKeysWarning />
            {children}
          </div>
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
    </>
  );
}