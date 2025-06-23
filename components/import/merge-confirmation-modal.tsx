import React, { useState, useEffect } from 'react'
import { Contact } from '@/types/contact'
import { DuplicateMatch } from '@/lib/contact-merger'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ContactCard } from '@/components/contact'

interface MergeConfirmationModalProps {
  duplicate: DuplicateMatch | null
  onDecision: (action: 'merge' | 'skip' | 'keep-both' | 'cancel' | 'merge-all') => void
  remainingCount?: number
  mergeProgress?: {
    current: number
    total: number
    message?: string
  }
}

export function MergeConfirmationModal({ 
  duplicate, 
  onDecision,
  remainingCount,
  mergeProgress
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
  
  // If we're in bulk merge mode, show progress instead of normal content
  const isBulkMerging = mergeProgress && mergeProgress.total > 0
  
  if (!duplicate && !isBulkMerging) return null
  
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
    <Dialog 
      open={!!duplicate || isBulkMerging} 
      onOpenChange={(open) => {
        if (!open && !isBulkMerging) {
          handleClose()
        }
      }}
    >
      <DialogContent 
        className={isBulkMerging ? "sm:max-w-md" : "sm:max-w-4xl"}
        onPointerDownOutside={(e) => (isProcessing || isBulkMerging) && e.preventDefault()}
        onEscapeKeyDown={(e) => (isProcessing || isBulkMerging) && e.preventDefault()}
        hideCloseButton={isProcessing || isBulkMerging}
      >
        {isBulkMerging ? (
          // Bulk merge progress UI
          <>
            <DialogHeader>
              <DialogTitle>Merging Contacts</DialogTitle>
              <DialogDescription>
                Processing duplicate contacts...
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    {mergeProgress.current} of {mergeProgress.total}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mergeProgress.message || 'Merging contacts...'}
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(mergeProgress.current / mergeProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Normal duplicate UI
          <>
            <DialogHeader>
              <DialogTitle>Duplicate Contact Found</DialogTitle>
              <DialogDescription>
                Match type: {duplicate.matchType} - {duplicate.matchValue}
              </DialogDescription>
            </DialogHeader>
        
        <div className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            A contact with similar information already exists. How would you like to proceed?
          </p>
        </div>
        
        <div className="space-y-4">
          {/* All three contacts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-center">Existing Contact</h4>
              <ContactCard 
                contact={duplicate.existing} 
                viewOnly 
                className="hover:bg-muted/50 cursor-default border" 
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-center">New Contact (Importing)</h4>
              <ContactCard 
                contact={duplicate.incoming} 
                viewOnly 
                className="hover:bg-muted/50 cursor-default border" 
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-center">
                {isLoadingPreview ? 'Loading...' : 'Merged Result'}
              </h4>
              {isLoadingPreview ? (
                <div className="border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : mergedPreview ? (
                <ContactCard 
                  contact={mergedPreview} 
                  viewOnly 
                  className="border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20" 
                />
              ) : (
                <div className="border rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                  <p className="text-xs text-muted-foreground">Preview unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {remainingCount !== undefined && remainingCount > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            {remainingCount} more duplicate{remainingCount > 1 ? 's' : ''} remaining after this
          </div>
        )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}