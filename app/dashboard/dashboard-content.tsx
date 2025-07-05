"use client";

import React, { useState } from "react";
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
  const { data: contacts = [], state: databaseState, isInitialLoad } = useContacts("");
  
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

  // Show loading message during initial load
  const getLoadingContent = () => {
    if (isInitialLoad) {
      const loadingMessage = databaseState === 'initializing' 
        ? { title: 'Loading your account...', subtitle: 'Please wait while we initialize your session' }
        : databaseState === 'unencrypting'
        ? { title: 'Initializing encrypted database...', subtitle: 'Setting up your secure contact storage' }
        : { title: 'Loading contacts...', subtitle: 'Retrieving your contacts' };
        
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium mb-2">{loadingMessage.title}</div>
          <p className="text-gray-600">{loadingMessage.subtitle}</p>
        </div>
      );
    }
    
    return children;
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
              disabled={isInitialLoad}
            />
            <ApiKeysWarning />
            {getLoadingContent()}
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