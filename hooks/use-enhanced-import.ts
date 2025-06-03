import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DuplicateMatch, areContactsIdentical } from '@/lib/contact-merger'
import { Contact } from '@/types/contact'

interface ImportResponse {
  success: boolean
  phase?: 'detection' | 'complete'
  processed?: {
    total: number
    normalized: number
    unique: number
    duplicates: number
  }
  uniqueContacts?: Contact[]
  duplicates?: DuplicateMatch[]
  parserUsed?: string
  rowCount?: number
  error?: string
}

interface SaveResponse {
  success: boolean
  totalContacts: number
  saved: number
  error?: string
}

export interface ImportProgress {
  status: 'idle' | 'detecting' | 'processing' | 'normalizing' | 'checking-duplicates' | 'resolving' | 'saving' | 'complete' | 'error'
  parserType?: 'linkedin' | 'rolodex' | 'google' | 'custom' | 'llm-normalizer'
  progress?: {
    current: number
    total: number
    message?: string
  }
  error?: string
}

export function useEnhancedImport(onComplete?: () => void) {
  const queryClient = useQueryClient()
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [currentDuplicate, setCurrentDuplicate] = useState<DuplicateMatch | null>(null)
  const [resolvedContacts, setResolvedContacts] = useState<Contact[]>([])
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: 'idle' })
  
  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File): Promise<ImportResponse> => {
      setImportProgress({ status: 'detecting' })
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Phase 1: Quick detection
      const detectResponse = await fetch('/api/import?phase=detect', {
        method: 'POST',
        body: formData
      })
      
      const detectData = await detectResponse.json()
      
      if (!detectResponse.ok) {
        throw new Error(detectData.error || 'Detection failed')
      }
      
      // Update progress with parser type
      const parserType = detectData.parserUsed === 'linkedin' ? 'linkedin' : 
                         detectData.parserUsed === 'rolodex' ? 'rolodex' : 
                         detectData.parserUsed === 'google' ? 'google' :
                         detectData.parserUsed === 'custom' ? 'custom' : 'llm-normalizer'
      
      // Show format detection animation
      setImportProgress({
        status: 'detecting',
        parserType,
        progress: {
          current: 0,
          total: detectData.rowCount || 0,
          message: 'Format detected!'
        }
      })
      
      // Wait to show the format selection animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Phase 2: Full processing
      // First update status to processing/normalizing
      setImportProgress({
        status: (parserType === 'linkedin' || parserType === 'rolodex' || parserType === 'google') ? 'processing' : 'normalizing',
        parserType,
        progress: {
          current: 0,
          total: detectData.rowCount || 0,
          message: parserType === 'linkedin' 
            ? 'Processing LinkedIn contacts...' 
            : parserType === 'rolodex'
            ? 'Processing Rolodex export...'
            : parserType === 'google'
            ? 'Processing Google contacts...'
            : 'AI is analyzing your contacts...'
        }
      })
      
      // Use streaming for custom parser (AI)
      if (parserType === 'custom' || parserType === 'llm-normalizer') {
        const processResponse = await fetch('/api/import-stream?phase=process', {
          method: 'POST',
          body: formData
        })
        
        if (!processResponse.ok) {
          throw new Error('Processing failed')
        }
        
        const { readJsonStream } = await import('@/lib/stream-utils')
        let finalData: any = null
        
        for await (const data of readJsonStream(processResponse)) {
          if (data.type === 'progress') {
            setImportProgress({
              status: 'normalizing',
              parserType,
              progress: {
                current: data.current,
                total: data.total,
                message: `AI is analyzing contact ${data.current} of ${data.total}...`
              }
            })
          } else if (data.type === 'complete') {
            finalData = {
              success: true,
              phase: 'complete',
              ...data
            }
          }
        }
        
        if (!finalData) {
          throw new Error('No data received from stream')
        }
        
        return finalData
      } else {
        // Use regular endpoint for other parsers
        const processResponse = await fetch('/api/import?phase=process', {
          method: 'POST',
          body: formData
        })
        
        const processData = await processResponse.json()
        
        if (!processResponse.ok) {
          throw new Error(processData.error || 'Processing failed')
        }
        
        return processData
      }
    },
    onSuccess: async (data) => {
      // Show checking duplicates status
      setImportProgress({
        status: 'checking-duplicates',
        parserType: importProgress.parserType,
        progress: {
          current: data.processed?.unique || 0,
          total: data.processed?.normalized || 0,
          message: 'Checking for duplicate contacts...'
        }
      })
      
      // Longer delay to show the checking phase properly
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Initialize with unique contacts
      setResolvedContacts(data.uniqueContacts || [])
      
      // If there are duplicates, start resolution
      if (data.duplicates && data.duplicates.length > 0) {
        // Filter out duplicates that are identical
        const meaningfulDuplicates = data.duplicates.filter((dup: DuplicateMatch) => {
          // Skip if contacts are identical
          return !areContactsIdentical(dup.existing, dup.incoming)
        })
        
        const skippedCount = data.duplicates.length - meaningfulDuplicates.length
        if (skippedCount > 0) {
          toast.info(`Auto-skipped ${skippedCount} duplicate${skippedCount > 1 ? 's' : ''} with no new information`)
        }
        
        if (meaningfulDuplicates.length > 0) {
          setImportProgress({ 
            status: 'resolving',
            parserType: importProgress.parserType
          })
          setDuplicates(meaningfulDuplicates)
          setCurrentDuplicate(meaningfulDuplicates[0])
        } else {
          // No meaningful duplicates, save unique contacts
          saveMutation.mutate(data.uniqueContacts || [])
        }
      } else {
        // No duplicates, save immediately
        saveMutation.mutate(data.uniqueContacts || [])
      }
    },
    onError: (error) => {
      setImportProgress({
        status: 'error',
        error: error instanceof Error ? error.message : 'Import failed'
      })
    }
  })
  
  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (contacts: Contact[]): Promise<SaveResponse> => {
      setImportProgress({
        status: 'saving',
        parserType: importProgress.parserType,
        progress: {
          current: 0,
          total: contacts.length,
          message: 'Saving contacts to database...'
        }
      })
      const response = await fetch('/api/import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Save failed')
      }
      
      return data
    },
    onSuccess: (data) => {
      setImportProgress({
        status: 'complete',
        parserType: importProgress.parserType,
        progress: {
          current: data.saved,
          total: data.saved,
          message: 'Import completed successfully!'
        }
      })
      
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success(`Successfully imported ${data.saved} contacts`)
      
      // Reset after delay
      setTimeout(() => {
        setImportProgress({ status: 'idle' })
        onComplete?.()
      }, 2000)
    },
    onError: (error) => {
      setImportProgress({
        status: 'error',
        error: error instanceof Error ? error.message : 'Save failed'
      })
    }
  })
  
  const handleDuplicateDecision = async (action: 'merge' | 'skip' | 'keep-both' | 'cancel' | 'merge-all') => {
    if (!currentDuplicate) return
    
    // Handle cancel - stop entire import
    if (action === 'cancel') {
      cancelImport()
      return
    }
    
    // Handle merge-all
    if (action === 'merge-all') {
      try {
        const allDuplicates = [currentDuplicate, ...duplicates.filter(d => d !== currentDuplicate)]
        
        toast.info(`Merging ${allDuplicates.length} contacts...`)
        
        // Use batch merge endpoint for efficiency
        const response = await fetch('/api/merge-contacts-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mergePairs: allDuplicates.map(dup => ({
              existing: dup.existing,
              incoming: dup.incoming
            }))
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to batch merge contacts')
        }
        
        const { mergedContacts } = await response.json()
        
        // Save all merged contacts
        if (mergedContacts.length > 0) {
          const response = await fetch('/api/import', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: mergedContacts })
          })
          
          if (response.ok) {
            toast.success(`Successfully merged ${mergedContacts.length} contacts`)
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
          }
        }
        
        // Clear duplicates and finish
        setDuplicates([])
        setCurrentDuplicate(null)
        
        // Save any remaining unique contacts
        if (resolvedContacts.length > 0) {
          saveMutation.mutate(resolvedContacts)
        } else {
          setImportProgress({
            status: 'complete',
            parserType: importProgress.parserType,
            progress: {
              current: mergedContacts.length,
              total: mergedContacts.length,
              message: 'Import completed!'
            }
          })
          
          setTimeout(() => {
            setImportProgress({ status: 'idle' })
            onComplete?.()
          }, 2000)
        }
        
        return
      } catch (error) {
        console.error('Failed to merge all contacts:', error)
        toast.error('Failed to merge all contacts')
        return
      }
    }
    
    const remainingDuplicates = [...duplicates]
    const currentIndex = remainingDuplicates.findIndex(d => d === currentDuplicate)
    
    // Handle the current duplicate
    let contactToSave: Contact | null = null
    
    if (action === 'merge') {
      try {
        // Call the merge API endpoint
        const response = await fetch('/api/merge-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            existing: currentDuplicate.existing,
            incoming: currentDuplicate.incoming
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to merge contacts')
        }
        
        const { mergedContact } = await response.json()
        contactToSave = mergedContact
      } catch (error) {
        console.error('Failed to merge contacts:', error)
        toast.error('Failed to merge contacts')
        return
      }
    } else if (action === 'keep-both') {
      contactToSave = currentDuplicate.incoming as Contact
    }
    // If 'skip', contactToSave remains null
    
    // Save immediately if we have a contact to save
    if (contactToSave) {
      try {
        // Save this single contact immediately
        const response = await fetch('/api/import', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: [contactToSave] })
        })
        
        if (!response.ok) {
          throw new Error('Failed to save contact')
        }
        
        // Refresh contacts list
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        
        // Show feedback
        if (action === 'merge') {
          toast.success('Contact merged and saved')
        } else {
          toast.success('Contact saved')
        }
      } catch (error) {
        console.error('Failed to save contact:', error)
        toast.error('Failed to save merged contact')
      }
    }
    
    // Remove current duplicate and move to next
    remainingDuplicates.splice(currentIndex, 1)
    setDuplicates(remainingDuplicates)
    
    if (remainingDuplicates.length > 0) {
      // Move to next duplicate immediately
      setCurrentDuplicate(remainingDuplicates[0])
    } else {
      // All duplicates handled, now save any remaining unique contacts
      setCurrentDuplicate(null)
      if (resolvedContacts.length > 0) {
        saveMutation.mutate(resolvedContacts)
      } else {
        // No more contacts to save, we're done
        setImportProgress({
          status: 'complete',
          parserType: importProgress.parserType,
          progress: {
            current: 1,
            total: 1,
            message: 'Import completed!'
          }
        })
        
        toast.success('Import completed!')
        
        setTimeout(() => {
          setImportProgress({ status: 'idle' })
          onComplete?.()
        }, 2000)
      }
    }
  }
  
  const resetImport = () => {
    setImportProgress({ status: 'idle' })
    setDuplicates([])
    setCurrentDuplicate(null)
    setResolvedContacts([])
  }
  
  const cancelImport = () => {
    // Cancel any pending mutations
    importMutation.reset()
    saveMutation.reset()
    
    // Reset state
    resetImport()
    
    toast.info('Import cancelled')
  }
  
  return {
    importFile: (file: File) => {
      // Set detecting status immediately before mutation
      setImportProgress({ status: 'detecting' })
      importMutation.mutate(file)
    },
    isImporting: importMutation.isPending,
    isSaving: saveMutation.isPending,
    currentDuplicate,
    duplicatesCount: duplicates.length,
    handleDuplicateDecision,
    error: importMutation.error || saveMutation.error,
    importProgress,
    resetImport,
    cancelImport
  }
}