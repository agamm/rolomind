import React, { useState, useEffect } from 'react'
import { Contact } from '@/types/contact'
import { DuplicateMatch } from '@/lib/contact-merger'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ContactCard } from '@/components/contact'

interface MergeConfirmationModalProps {
  duplicate: DuplicateMatch | null
  onDecision: (action: 'merge' | 'skip' | 'keep-both' | 'cancel') => void
  remainingCount?: number
  isProcessing?: boolean
}

export function MergeConfirmationModal({ 
  duplicate, 
  onDecision,
  remainingCount,
  isProcessing = false
}: MergeConfirmationModalProps) {
  const [mergedPreview, setMergedPreview] = useState<Contact | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  
  useEffect(() => {
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
            incoming: duplicate.incoming
          })
        })
        
        if (response.ok) {
          const { mergedContact } = await response.json()
          setMergedPreview(mergedContact)
        }
      } catch (error) {
        console.error('Failed to get merge preview:', error)
      } finally {
        setIsLoadingPreview(false)
      }
    }
    
    fetchMergePreview()
  }, [duplicate])
  
  const handleDecision = (action: 'merge' | 'skip' | 'keep-both' | 'cancel') => {
    onDecision(action)
  }
  
  if (!duplicate) return null
  
  const { existing, incoming, matchType, matchValue } = duplicate
  
  return (
    <Dialog open={!!duplicate} onOpenChange={(open) => {
      if (!open) handleDecision('cancel')
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
              <p className="text-sm text-gray-600 font-medium">Processing...</p>
            </div>
          </div>
        )}
        <DialogHeader>
          <DialogTitle className="text-center">
            Duplicate Contact Found
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span>Match found by <strong>{matchType}</strong>: {matchValue}</span>
              </div>
              {remainingCount && remainingCount > 0 && (
                <p className="text-sm text-gray-500">
                  {remainingCount} more duplicate{remainingCount > 1 ? 's' : ''} to review
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 my-6">
          {/* Existing Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              Current Contact
            </h3>
            <div className="border-2 border-gray-200 rounded-lg">
              <ContactCard contact={existing} />
            </div>
          </div>
          
          {/* Incoming Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              New Contact
            </h3>
            <div className="border-2 border-blue-200 rounded-lg">
              <ContactCard contact={incoming as Contact} />
            </div>
          </div>
          
          {/* Merged Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-green-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              After Merge
            </h3>
            <div className="border-2 border-green-300 rounded-lg bg-green-50">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                </div>
              ) : mergedPreview ? (
                <ContactCard contact={mergedPreview} />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Unable to preview merge
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => handleDecision('skip')} disabled={isProcessing}>
            Skip This Contact
          </Button>
          <Button variant="outline" onClick={() => handleDecision('keep-both')} disabled={isProcessing}>
            Keep Both
          </Button>
          <Button onClick={() => handleDecision('merge')} className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
            Merge Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}