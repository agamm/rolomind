import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DuplicateMatch, areContactsIdentical, hasLessOrEqualInformation, findDuplicates } from '@/lib/contact-merger'
import { Contact } from '@/types/contact'
import { saveContacts, updateContact, getContactsCount } from '@/hooks/use-local-contacts'
import { getCurrentUserDatabase } from '@/db/indexdb'
import { CONTACT_LIMITS } from '@/lib/config'
import { useSession } from '@/lib/auth/auth-client'
import { initializeUserDatabase } from '@/db/indexdb'

// Simple contact size estimation for UI purposes
function getContactTokenCount(contact: Contact): number {
  const contactString = JSON.stringify(contact);
  return Math.ceil(contactString.length / 3); // Rough estimate: 3 chars per token
}

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
  status: 'idle' | 'detecting' | 'preview' | 'processing' | 'normalizing' | 'checking-duplicates' | 'resolving' | 'saving' | 'complete' | 'error'
  parserType?: 'linkedin' | 'rolodex' | 'google' | 'custom' | 'llm-normalizer'
  progress?: {
    current: number
    total: number
    message?: string
  }
  mergeProgress?: {
    current: number
    total: number
    message?: string
  }
  error?: string
  csvHeaders?: string[]
  sampleRow?: Record<string, string>
  pendingFile?: File
  rowCount?: number
}

export function useEnhancedImport(onComplete?: () => void) {
  const { data: session } = useSession()
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [currentDuplicate, setCurrentDuplicate] = useState<DuplicateMatch | null>(null)
  const [resolvedContacts, setResolvedContacts] = useState<Contact[]>([])
  const [importProgress, setImportProgress] = useState<ImportProgress>({ status: 'idle' })
  const [oversizedContacts, setOversizedContacts] = useState<Array<{ contact: Contact; tokenCount: number; index: number }>>([])
  const [pendingImportContacts, setPendingImportContacts] = useState<Contact[]>([])
  
  // Initialize user database when session changes
  useEffect(() => {
    if (session?.user?.email && session?.user?.id) {
      initializeUserDatabase(session.user.email, session.user.id).catch(error => {
        console.error('Failed to initialize user database:', error)
      })
    }
  }, [session?.user?.email, session?.user?.id])
  
  // Import function
  const importFile = async (file: File): Promise<ImportResponse> => {
      if (!session?.user?.email) {
        throw new Error('User not authenticated')
      }
      
      // Check current contact count before starting
      const currentCount = await getContactsCount()
      
      if (currentCount >= CONTACT_LIMITS.MAX_CONTACTS) {
        throw new Error(`Cannot import contacts. You have reached the maximum limit of ${CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()} contacts. Please contact support at <a href="mailto:help@rolomind.com" class="underline">help@rolomind.com</a> for assistance.`)
      }
      
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
      
      // Get headers and first row from the API response
      const csvHeaders = detectData.headers || []
      const sampleRow = detectData.firstRow || {}
      
      // Show format detection animation
      setImportProgress({
        status: 'detecting',
        parserType,
        progress: {
          current: 0,
          total: detectData.rowCount || 0,
          message: 'Format detected!'
        },
        csvHeaders,
        sampleRow,
        pendingFile: file,
        rowCount: detectData.rowCount
      })
      
      // Wait to show the format selection animation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Show preview dialog
      setImportProgress(prev => ({
        ...prev,
        status: 'preview'
      }))
      
      // Return early - the actual processing will happen when user confirms preview
      return { success: true, phase: 'detection', parserUsed: parserType }
  }

  const handleImportSuccess = async (data: ImportResponse) => {
      // If we're in detection phase, don't process contacts yet
      if (data.phase === 'detection') {
        return
      }
      
      if (!data.contacts || data.contacts.length === 0) {
        toast.error('No contacts found in the import file')
        setImportProgress({ status: 'idle' })
        return
      }

      // First check for oversized contacts
      const oversized = data.contacts
        .map((contact, index) => ({
          contact,
          tokenCount: getContactTokenCount(contact),
          index
        }))
        .filter(item => item.tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT)

      if (oversized.length > 0) {
        // Store oversized contacts for modal
        setOversizedContacts(oversized)
        setPendingImportContacts(data.contacts)
        
        // Show warning toast
        toast.warning(`${oversized.length} oversized contact${oversized.length > 1 ? 's' : ''} detected`)
        
        // Don't proceed until user decides
        return
      }

      // No oversized contacts, proceed with duplicate check
      await checkDuplicatesAndSave(data.contacts)
  }

  const handleImportError = (error: Error) => {
    setImportProgress(prev => ({
      ...prev,
      status: 'error',
      error: error.message || 'Import failed'
    }))
    
    // Show appropriate toast for contact limit errors
    if (error.message.includes('maximum limit')) {
      toast.error('Contact limit reached. Please delete some contacts before importing new ones.')
    }
  }

  const checkDuplicatesAndSave = async (contacts: Contact[]) => {
      // Show checking duplicates status
      setImportProgress({
        status: 'checking-duplicates',
        parserType: importProgress.parserType,
        progress: {
          current: 0,
          total: contacts.length,
          message: 'Checking for duplicate contacts...'
        }
      })
      
      // Get existing contacts from local database
      const db = await getCurrentUserDatabase()
      const existingContacts = await db.contacts.toArray()
      
      // Check if importing would exceed the contact limit
      const currentCount = existingContacts.length
      const newCount = contacts.length
      const totalAfterImport = currentCount + newCount
      
      if (totalAfterImport > CONTACT_LIMITS.MAX_CONTACTS) {
        const availableSlots = Math.max(0, CONTACT_LIMITS.MAX_CONTACTS - currentCount)
        setImportProgress({
          status: 'error',
          error: `Cannot import ${newCount} contacts. You have ${currentCount.toLocaleString()} contacts and the maximum is ${CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()}. Only ${availableSlots.toLocaleString()} more contacts can be added. Please contact support at <a href="mailto:help@rolomind.com" class="underline">help@rolomind.com</a> for assistance.`
        })
        toast.error(`Contact limit exceeded. Maximum ${CONTACT_LIMITS.MAX_CONTACTS.toLocaleString()} contacts allowed. Contact support for help.`)
        return
      }
      
      // Find duplicates
      const contactsWithDuplicates = contacts.map(contact => {
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
        // Filter out duplicates that are identical or have less/equal information
        const meaningfulDuplicates = duplicatesFound.filter((dup: DuplicateMatch) => {
          // Skip if contacts are identical or incoming has less/equal info
          return !areContactsIdentical(dup.existing, dup.incoming) && 
                 !hasLessOrEqualInformation(dup.existing, dup.incoming)
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
          await saveContactsToDatabase(uniqueContacts)
        }
      } else {
        // No duplicates, save immediately
        await saveContactsToDatabase(uniqueContacts)
      }
  }
  
  // Save contacts to local database with import completion UI
  const saveContactsToDatabase = async (contacts: Contact[], showSuccessToast: boolean = true) => {
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
      await saveContacts(contacts)
      
      setImportProgress({
        status: 'complete',
        parserType: importProgress.parserType,
        progress: {
          current: contacts.length,
          total: contacts.length,
          message: 'Import completed successfully!'
        }
      })
      
      if (showSuccessToast) {
        toast.success(`Successfully imported ${contacts.length} contacts`)
      }
      
      // Force refresh the contacts list
      if (typeof window !== 'undefined' && (window as any).refreshContacts) {
        (window as any).refreshContacts();
      }
      
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
  
  const handleDuplicateDecision = async (action: 'merge' | 'skip' | 'keep-both' | 'cancel' | 'merge-all' | 'skip-all') => {
    if (!currentDuplicate) return
    
    // Handle cancel - stop entire import
    if (action === 'cancel') {
      cancelImport()
      return
    }
    
    // Handle skip-all
    if (action === 'skip-all') {
      const allDuplicates = [currentDuplicate, ...duplicates.filter(d => d !== currentDuplicate)]
      toast.info(`Skipped ${allDuplicates.length} duplicate contacts`)
      
      // Clear duplicates and move to saving unique contacts
      setDuplicates([])
      setCurrentDuplicate(null)
      
      if (resolvedContacts.length > 0) {
        await saveContacts(resolvedContacts)
      } else {
        setImportProgress({ status: 'idle' })
        toast.info('Import completed - all duplicates were skipped')
      }
      return
    }
    
    // Handle merge-all
    if (action === 'merge-all') {
      try {
        const allDuplicates = [currentDuplicate, ...duplicates.filter(d => d !== currentDuplicate)]
        
        toast.info(`Merging ${allDuplicates.length} contacts...`)
        
        // Keep status as 'resolving' to prevent showing import modal
        setImportProgress(prev => ({
          ...prev,
          status: 'resolving',
          mergeProgress: {
            current: 0,
            total: allDuplicates.length,
            message: 'Merging duplicate contacts...'
          }
        }))
        
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
            
            // Update merge progress (not regular progress to avoid showing modal)
            setImportProgress(prev => ({
              ...prev,
              mergeProgress: {
                current: totalProcessed,
                total: allDuplicates.length,
                message: `Merged ${totalProcessed} of ${allDuplicates.length} contacts...`
              }
            }))
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
        }
        
        // Clear duplicates and finish
        setDuplicates([])
        setCurrentDuplicate(null)
        
        // Save any remaining unique contacts (suppress toast, merge-all handles completion)
        if (resolvedContacts.length > 0) {
          await saveContactsToDatabase(resolvedContacts, false)
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
          
          toast.success('Import completed!')
          
          // Force refresh the contacts list
          if (typeof window !== 'undefined' && (window as any).refreshContacts) {
            (window as any).refreshContacts();
          }
          
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
        // Save to local database
        if (action === 'merge') {
          await updateContact(contactToSave)
        } else {
          await saveContacts([contactToSave])
        }
        
        // Database will auto-refresh via useLiveQuery
        
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
        await saveContactsToDatabase(resolvedContacts)
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
        
        // Force refresh the contacts list
        if (typeof window !== 'undefined' && (window as any).refreshContacts) {
          (window as any).refreshContacts();
        }
        
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
    setOversizedContacts([])
    setPendingImportContacts([])
  }
  
  const cancelImport = () => {
    resetImport()
    toast.info('Import cancelled')
  }

  const handleOversizedDecision = async (action: 'skip-all' | 'skip-selected' | 'continue', selectedIndices?: number[]) => {
    let contactsToImport = pendingImportContacts

    if (action === 'skip-all') {
      // Filter out all oversized contacts
      const oversizedIndices = new Set(oversizedContacts.map(oc => oc.index))
      contactsToImport = pendingImportContacts.filter((_, index) => !oversizedIndices.has(index))
      toast.info(`Skipped ${oversizedContacts.length} oversized contacts`)
    } else if (action === 'skip-selected' && selectedIndices) {
      // Filter out selected oversized contacts
      const skipIndices = new Set(selectedIndices)
      contactsToImport = pendingImportContacts.filter((_, index) => !skipIndices.has(index))
      toast.info(`Skipped ${selectedIndices.length} oversized contacts`)
    }
    // If 'continue', import all including oversized

    // Clear oversized state
    setOversizedContacts([])
    setPendingImportContacts([])

    // Proceed with duplicate check
    await checkDuplicatesAndSave(contactsToImport)
  }
  
  const continueImportAfterPreview = async () => {
    if (!importProgress.pendingFile || !importProgress.parserType) {
      toast.error('Import data not found')
      return
    }
    
    const file = importProgress.pendingFile
    const parserType = importProgress.parserType
    
    // Update status to processing/normalizing
    setImportProgress({
      status: (parserType === 'linkedin' || parserType === 'rolodex' || parserType === 'google') ? 'processing' : 'normalizing',
      parserType,
      progress: importProgress.progress
    })
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Use streaming for custom parser (AI)
      if (parserType === 'custom' || parserType === 'llm-normalizer') {
        const processResponse = await fetch('/api/import-ai-stream?phase=process', {
          method: 'POST',
          body: formData
        })
        
        if (!processResponse.ok) {
          const errorData = await processResponse.json()
          if (processResponse.status === 402) {
            throw new Error(errorData.details || errorData.error || 'AI service not configured. Please configure your API keys in Settings > AI Keys.')
          }
          throw new Error(errorData.error || 'Processing failed')
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
          } else if (data.type === 'error') {
            throw new Error(data.message || 'AI normalization failed')
          }
        }
        
        if (finalData && finalData.contacts) {
          await handleImportSuccess(finalData)
        } else {
          throw new Error('No contacts found in the import file')
        }
      } else {
        // Regular processing for non-AI parsers
        const processFormData = new FormData()
        processFormData.append('file', file)
        
        const processResponse = await fetch(`/api/import?phase=process&parserType=${parserType}`, {
          method: 'POST',
          body: processFormData
        })
        
        const processData = await processResponse.json()
        
        if (!processResponse.ok) {
          throw new Error(processData.error || 'Processing failed')
        }
        
        if (processData.contacts) {
          await handleImportSuccess(processData)
        }
      }
    } catch (error) {
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Import failed'
      }))
      // Don't show toast - error is shown in modal
    }
  }

  return {
    importFile: async (file: File) => {
      // Set detecting status immediately
      setImportProgress({ status: 'detecting' })
      try {
        const result = await importFile(file)
        await handleImportSuccess(result)
      } catch (error) {
        handleImportError(error instanceof Error ? error : new Error('Import failed'))
      }
    },
    isImporting: importProgress.status === 'detecting' || importProgress.status === 'normalizing' || importProgress.status === 'processing',
    isSaving: importProgress.status === 'saving',
    currentDuplicate,
    duplicatesCount: duplicates.length,
    handleDuplicateDecision,
    importProgress,
    resetImport,
    cancelImport,
    oversizedContacts,
    handleOversizedDecision,
    continueImportAfterPreview
  }
}