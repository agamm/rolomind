import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DuplicateMatch, areContactsIdentical, findDuplicates } from '@/lib/contact-merger'
import { Contact } from '@/types/contact'
import { getAllContacts, createContactsBatch, updateContact } from '@/db/local/contacts'

interface ImportResponse {
  success: boolean
  phase?: 'detection' | 'complete'
  processed?: {
    total: number
    normalized: number
  }
  contacts?: Contact[]
  parserUsed?: string
  rowCount?: number
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
        const processResponse = await fetch('/api/import-ai-stream?phase=process', {
          method: 'POST',
          body: formData
        })
        
        if (!processResponse.ok) {
          throw new Error('Processing failed')
        }
        
        const { readJsonStream } = await import('@/lib/stream-utils')
        let finalData: ImportResponse | null = null
        
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
          current: 0,
          total: data.processed?.normalized || 0,
          message: 'Checking for duplicate contacts...'
        }
      })
      
      // Get existing contacts from local database
      const existingContacts = await getAllContacts()
      
      // Find duplicates
      const contactsWithDuplicates = (data.contacts || []).map(contact => {
        const duplicateMatches = findDuplicates(existingContacts, contact)
        return { contact, duplicates: duplicateMatches }
      })
      
      const uniqueContacts = contactsWithDuplicates
        .filter(item => item.duplicates.length === 0)
        .map(item => item.contact)
      
      const duplicatesFound = contactsWithDuplicates
        .filter(item => item.duplicates.length > 0)
        .map(item => ({
          existing: item.duplicates[0].existing,
          incoming: item.contact,
          matchType: item.duplicates[0].matchType,
          matchValue: item.duplicates[0].matchValue
        }))
      
      // Longer delay to show the checking phase properly
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Initialize with unique contacts
      setResolvedContacts(uniqueContacts)
      
      // If there are duplicates, start resolution
      if (duplicatesFound.length > 0) {
        // Filter out duplicates that are identical
        const meaningfulDuplicates = duplicatesFound.filter((dup: DuplicateMatch) => {
          // Skip if contacts are identical
          return !areContactsIdentical(dup.existing, dup.incoming)
        })
        
        const skippedCount = duplicatesFound.length - meaningfulDuplicates.length
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
          await saveContacts(uniqueContacts)
        }
      } else {
        // No duplicates, save immediately
        await saveContacts(uniqueContacts)
      }
    },
    onError: (error) => {
      setImportProgress({
        status: 'error',
        error: error instanceof Error ? error.message : 'Import failed'
      })
    }
  })
  
  // Save contacts to local database
  const saveContacts = async (contacts: Contact[]) => {
    setImportProgress({
      status: 'saving',
      parserType: importProgress.parserType,
      progress: {
        current: 0,
        total: contacts.length,
        message: 'Saving contacts to database...'
      }
    })
    
    try {
      await createContactsBatch(contacts)
      
      setImportProgress({
        status: 'complete',
        parserType: importProgress.parserType,
        progress: {
          current: contacts.length,
          total: contacts.length,
          message: 'Import completed successfully!'
        }
      })
      
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success(`Successfully imported ${contacts.length} contacts`)
      
      // Reset after delay
      setTimeout(() => {
        setImportProgress({ status: 'idle' })
        onComplete?.()
      }, 2000)
    } catch (error) {
      setImportProgress({
        status: 'error',
        error: error instanceof Error ? error.message : 'Save failed'
      })
    }
  }
  
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
        
        // Update import progress to show merging status
        setImportProgress({
          status: 'processing',
          parserType: importProgress.parserType,
          progress: {
            current: 0,
            total: allDuplicates.length,
            message: 'Merging duplicate contacts...'
          }
        })
        
        // Process merges in batches
        const BATCH_SIZE = 20
        const allMergedContacts: Contact[] = []
        let totalProcessed = 0
        
        console.log(`Starting merge-all with ${allDuplicates.length} contacts`)
        
        for (let i = 0; i < allDuplicates.length; i += BATCH_SIZE) {
          const batch = allDuplicates.slice(i, Math.min(i + BATCH_SIZE, allDuplicates.length))
          
          // Process batch in parallel
          const batchPromises = batch.map(async (dup) => {
            try {
              const response = await fetch('/api/merge-contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  existing: dup.existing,
                  incoming: dup.incoming
                })
              })
              
              if (!response.ok) {
                throw new Error('Failed to merge contact')
              }
              
              const { mergedContact } = await response.json()
              return { success: true, contact: mergedContact }
            } catch (error) {
              console.error('Failed to merge contact:', error)
              return { success: false }
            }
          })
          
          const results = await Promise.all(batchPromises)
          
          // Collect successful merges
          for (const result of results) {
            if (result.success && result.contact) {
              allMergedContacts.push(result.contact)
            }
            totalProcessed++
            
            // Update progress
            setImportProgress({
              status: 'processing',
              parserType: importProgress.parserType,
              progress: {
                current: totalProcessed,
                total: allDuplicates.length,
                message: `Merged ${totalProcessed} of ${allDuplicates.length} contacts...`
              }
            })
          }
          
          // Show toast update every batch
          if (totalProcessed % 10 === 0 || totalProcessed === allDuplicates.length) {
            toast.info(`Merged ${totalProcessed} of ${allDuplicates.length} contacts...`)
          }
        }
        
        // Save all merged contacts
        if (allMergedContacts.length > 0) {
          // Update existing contacts in local database
          for (const contact of allMergedContacts) {
            await updateContact(contact)
          }
          
          toast.success(`Successfully merged ${allMergedContacts.length} contacts`)
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
        }
        
        // Clear duplicates and finish
        setDuplicates([])
        setCurrentDuplicate(null)
        
        // Save any remaining unique contacts
        if (resolvedContacts.length > 0) {
          await saveContacts(resolvedContacts)
        } else {
          setImportProgress({
            status: 'complete',
            parserType: importProgress.parserType,
            progress: {
              current: allMergedContacts.length,
              total: allMergedContacts.length,
              message: 'Import completed!'
            }
          })
          
          setTimeout(() => {
            setImportProgress({ status: 'idle' })
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
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
        // Save to local database
        if (action === 'merge') {
          await updateContact(contactToSave)
        } else {
          await createContactsBatch([contactToSave])
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
        await saveContacts(resolvedContacts)
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
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
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
    isSaving: false,
    currentDuplicate,
    duplicatesCount: duplicates.length,
    handleDuplicateDecision,
    error: importMutation.error,
    importProgress,
    resetImport,
    cancelImport
  }
}