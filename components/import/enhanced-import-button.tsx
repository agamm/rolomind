"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { MergeConfirmationModal } from './merge-confirmation-modal'
import { DuplicateMatch, mergeContacts } from '@/lib/contact-merger'
import { Contact } from '@/types/contact'
import { Progress } from '@/components/ui/progress'

interface ImportState {
  status: 'idle' | 'uploading' | 'processing' | 'resolving-duplicates' | 'saving' | 'complete'
  progress?: {
    current: number
    total: number
    message: string
  }
  results?: {
    total: number
    normalized: number
    unique: number
    duplicates: number
    errors: number
  }
}

export function EnhancedImportButton({ onImportComplete }: { onImportComplete?: () => void }) {
  const [state, setState] = useState<ImportState>({ status: 'idle' })
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [currentDuplicate, setCurrentDuplicate] = useState<DuplicateMatch | null>(null)
  const [resolvedContacts, setResolvedContacts] = useState<Contact[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setState({ status: 'uploading' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      setState({ 
        status: 'processing',
        progress: {
          current: 0,
          total: 100,
          message: 'Analyzing CSV structure and normalizing contacts...'
        }
      })

      const response = await fetch('/api/import-with-llm', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setState({ 
        status: 'resolving-duplicates',
        results: data.processed
      })

      // Start with unique contacts
      setResolvedContacts(data.uniqueContacts)
      
      // If there are duplicates, start the resolution process
      if (data.duplicates.length > 0) {
        setDuplicates(data.duplicates)
        setCurrentDuplicate(data.duplicates[0])
      } else {
        // No duplicates, save immediately
        await saveContacts(data.uniqueContacts)
      }

      // Show errors if any
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} rows had errors`, {
          description: data.errors[0]
        })
      }
    } catch (error) {
      console.error('Import error:', error)
      setState({ status: 'idle' })
      toast.error('Import failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDuplicateDecision = async (action: 'merge' | 'skip' | 'keep-both') => {
    if (!currentDuplicate) return

    const remainingDuplicates = [...duplicates]
    const currentIndex = remainingDuplicates.findIndex(d => d === currentDuplicate)
    
    if (action === 'merge') {
      // Merge the contacts
      const merged = mergeContacts(currentDuplicate.existing, currentDuplicate.incoming)
      setResolvedContacts(prev => [...prev, { ...merged, mergeWithId: currentDuplicate.existing.id }])
    } else if (action === 'keep-both') {
      // Keep both contacts
      setResolvedContacts(prev => [...prev, currentDuplicate.incoming as Contact])
    }
    // If 'skip', we don't add the incoming contact

    // Remove current duplicate from list
    remainingDuplicates.splice(currentIndex, 1)
    setDuplicates(remainingDuplicates)

    // Move to next duplicate or finish
    if (remainingDuplicates.length > 0) {
      setCurrentDuplicate(remainingDuplicates[0])
    } else {
      setCurrentDuplicate(null)
      // All duplicates resolved, save contacts
      await saveContacts(resolvedContacts)
    }
  }

  const saveContacts = async (contacts: Contact[]) => {
    setState({ 
      status: 'saving',
      progress: {
        current: 0,
        total: contacts.length,
        message: 'Saving contacts...'
      }
    })

    try {
      const response = await fetch('/api/import-with-llm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Save failed')
      }

      setState({ status: 'complete', results: state.results })
      
      toast.success('Import complete!', {
        description: `${data.saved} contacts imported successfully`
      })

      // Trigger refresh
      onImportComplete?.()
      
      // Reset after delay
      setTimeout(() => setState({ status: 'idle' }), 3000)
    } catch (error) {
      console.error('Save error:', error)
      setState({ status: 'idle' })
      toast.error('Failed to save contacts', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const getButtonContent = () => {
    switch (state.status) {
      case 'uploading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        )
      case 'processing':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing CSV...
          </>
        )
      case 'resolving-duplicates':
        return (
          <>
            <AlertCircle className="h-4 w-4" />
            Resolving {duplicates.length} duplicates...
          </>
        )
      case 'saving':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving contacts...
          </>
        )
      case 'complete':
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            Import Complete!
          </>
        )
      default:
        return (
          <>
            <Upload className="h-4 w-4" />
            Import CSV
          </>
        )
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={state.status !== 'idle'}
        variant={state.status === 'complete' ? 'outline' : 'default'}
        className={state.status === 'complete' ? 'border-green-600 text-green-600' : ''}
      >
        {getButtonContent()}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {state.progress && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{state.progress.message}</span>
            <span className="text-gray-500">
              {state.progress.current} / {state.progress.total}
            </span>
          </div>
          <Progress 
            value={(state.progress.current / state.progress.total) * 100} 
            className="h-2"
          />
        </div>
      )}
      
      {state.results && state.status === 'complete' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Import Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Total rows: <strong>{state.results.total}</strong></div>
            <div>Normalized: <strong>{state.results.normalized}</strong></div>
            <div>New contacts: <strong>{state.results.unique}</strong></div>
            <div>Duplicates handled: <strong>{state.results.duplicates}</strong></div>
            {state.results.errors > 0 && (
              <div className="col-span-2 text-red-600">
                Errors: <strong>{state.results.errors}</strong>
              </div>
            )}
          </div>
        </div>
      )}
      
      <MergeConfirmationModal
        duplicate={currentDuplicate}
        onDecision={handleDuplicateDecision}
        remainingCount={duplicates.length - 1}
      />
    </div>
  )
}