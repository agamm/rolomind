"use client";

import React from "react";
import { TopNav } from "@/components/layout";
import { useContacts } from "@/hooks/use-local-contacts";
import { useEnhancedImport } from "@/hooks/use-enhanced-import";
import { MergeConfirmationModal } from "@/components/import/merge-confirmation-modal";
import { ImportProgressModal } from "@/components/import/import-progress-modal";

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
    cancelImport
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
            {children}
          </div>
        </div>
      </div>

      <ImportProgressModal
        isOpen={importProgress.status !== 'idle' && importProgress.status !== 'resolving'}
        status={importProgress.status === 'idle' || importProgress.status === 'resolving' ? 'detecting' : importProgress.status}
        parserType={importProgress.parserType}
        progress={importProgress.progress}
        error={importProgress.error}
        onClose={cancelImport}
      />
      
      <MergeConfirmationModal
        duplicate={currentDuplicate}
        onDecision={handleDuplicateDecision}
        remainingCount={duplicatesCount - 1}
      />
    </>
  );
}