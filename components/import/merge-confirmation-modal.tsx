import React, { useState, useEffect } from 'react'
import { Contact } from '@/types/contact'
import { DuplicateMatch } from '@/lib/contact-merger'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ContactCard } from '@/components/contact'

interface MergeConfirmationModalProps {
  duplicate: DuplicateMatch | null
  onDecision: (action: 'merge' | 'skip' | 'keep-both' | 'cancel' | 'merge-all') => void
  remainingCount?: number
}

export function MergeConfirmationModal({ 
  duplicate, 
  onDecision,
  remainingCount
}: MergeConfirmationModalProps) {
  const [mergedPreview, setMergedPreview] = useState<Contact | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionType, setActionType] = useState<'merge' | 'skip' | 'keep-both' | 'merge-all' | null>(null)
  
  useEffect(() => {
    // Reset processing state when duplicate changes
    setIsProcessing(false)
    setActionType(null)
    
    if (!duplicate) {
      // Reset states when duplicate is cleared
      setMergedPreview(null)
      return
    }
    
    // Fetch merge preview
    const fetchMergePreview = async () => {
      setIsLoadingPreview(true)
      try {
        const response = await fetch('/api/merge-contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            existing: duplicate.existing,
            incoming: duplicate.incoming,
            previewOnly: true
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate merge preview')
        }
        
        const { merged } = await response.json()
        setMergedPreview(merged)
      } catch (error) {
        console.error('Failed to generate merge preview:', error)
      } finally {
        setIsLoadingPreview(false)
      }
    }
    
    fetchMergePreview()
  }, [duplicate])
  
  if (!duplicate) return null
  
  const handleDecision = (action: 'merge' | 'skip' | 'keep-both' | 'merge-all') => {
    setIsProcessing(true)
    setActionType(action)
    
    // Add a small delay to show the processing state
    setTimeout(() => {
      onDecision(action)
    }, 300)
  }
  
  const handleClose = () => {
    if (!isProcessing) {
      onDecision('cancel')
    }
  }
  
  return (
    <Modal
      isOpen={!!duplicate}
      onClose={handleClose}
      title="Duplicate Contact Found"
      description={`Match type: ${duplicate.matchType} - ${duplicate.matchValue}`}
      size="xl"
      preventOutsideClick={isProcessing}
      preventEscapeKey={isProcessing}
      showCloseButton={!isProcessing}
    >
      <div className="py-4">
        <div className="flex items-center gap-2 mb-4 px-6">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            A contact with similar information already exists. How would you like to proceed?
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-6">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-center">Existing Contact</h4>
            <ContactCard 
              contact={duplicate.existing} 
              viewOnly 
              className="hover:bg-muted/50 cursor-default" 
            />
          </div>
          <div className="space-y-2 md:pt-8">
            <div className="text-center text-2xl">→</div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-center">New Contact</h4>
            <ContactCard 
              contact={duplicate.incoming} 
              viewOnly 
              className="hover:bg-muted/50 cursor-default" 
            />
          </div>
        </div>
        
        {isLoadingPreview ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
            Generating merge preview...
          </div>
        ) : mergedPreview && (
          <div className="border-t pt-4 px-6">
            <h4 className="font-medium text-sm text-center mb-2">
              Merge Preview (Combined Information)
            </h4>
            <ContactCard 
              contact={mergedPreview} 
              viewOnly 
              className="border-2 border-primary/20 bg-primary/5" 
            />
          </div>
        )}
        
        {remainingCount !== undefined && remainingCount > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            {remainingCount} more duplicate{remainingCount > 1 ? 's' : ''} remaining after this
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 px-6 pb-6">
        <Button 
          onClick={() => handleDecision('merge')} 
          disabled={isProcessing}
          variant="default"
          className="flex-1"
        >
          {isProcessing && actionType === 'merge' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Merging...
            </>
          ) : (
            'Merge Contacts'
          )}
        </Button>
        <Button 
          onClick={() => handleDecision('keep-both')} 
          disabled={isProcessing}
          variant="outline"
          className="flex-1"
        >
          {isProcessing && actionType === 'keep-both' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            'Keep Both'
          )}
        </Button>
        <Button 
          onClick={() => handleDecision('skip')} 
          disabled={isProcessing}
          variant="ghost"
          className="flex-1"
        >
          {isProcessing && actionType === 'skip' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Skipping...
            </>
          ) : (
            'Skip Import'
          )}
        </Button>
        {remainingCount !== undefined && remainingCount > 3 && (
          <Button 
            onClick={() => handleDecision('merge-all')} 
            disabled={isProcessing}
            variant="secondary"
            className="flex-1"
          >
            {isProcessing && actionType === 'merge-all' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Merge All ${remainingCount + 1}`
            )}
          </Button>
        )}
      </div>
    </Modal>
  )
}