import React from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, FileText } from 'lucide-react'
import { Contact } from '@/types/contact'
import { getContactTokenCount, CONTACT_LIMITS } from '@/lib/contact-limits'
import { ScrollArea } from '@/components/ui/scroll-area'

interface OversizedContact {
  contact: Contact
  tokenCount: number
  index: number
  originalTokenCount?: number
}

interface OversizedContactsModalProps {
  isOpen: boolean
  oversizedContacts: OversizedContact[]
  onDecision: (action: 'skip-all' | 'skip-selected' | 'continue', selectedIndices?: number[]) => void
}

export function OversizedContactsModal({
  isOpen,
  oversizedContacts,
  onDecision
}: OversizedContactsModalProps) {
  const [selectedContacts, setSelectedContacts] = React.useState<Set<number>>(
    new Set(oversizedContacts.map(c => c.index))
  )

  const toggleContact = (index: number) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedContacts(newSelected)
  }

  const handleSkipSelected = () => {
    onDecision('skip-selected', Array.from(selectedContacts))
  }

  const handleClose = () => {
    // Don't allow closing without making a decision
    onDecision('skip-all')
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Oversized Contacts Detected</DialogTitle>
          <DialogDescription>
            {oversizedContacts.length} contact{oversizedContacts.length > 1 ? 's have' : ' has'} too much data
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These contacts exceed the maximum data limit of {CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens. 
            Large contacts can cause performance issues and storage problems.
          </AlertDescription>
        </Alert>

          <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Select which contacts to skip during import:
          </p>
          
            <ScrollArea className="h-[300px] border rounded-lg p-2">
            {oversizedContacts.map((item, idx) => (
              <div
                key={item.index}
                className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer"
                onClick={() => toggleContact(item.index)}
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.has(item.index)}
                  onChange={() => toggleContact(item.index)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.contact.name || 'Unnamed Contact'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.contact.company && `${item.contact.company} • `}
                    {item.tokenCount.toLocaleString()} tokens
                    {item.originalTokenCount && item.originalTokenCount !== item.tokenCount && 
                      ` (was ${item.originalTokenCount.toLocaleString()})`
                    }
                  </p>
                  {item.contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      Notes: {item.contact.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            </ScrollArea>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Options:</p>
            <ul className="space-y-1 text-xs">
              <li>• Skip selected: Import only unselected contacts</li>
              <li>• Skip all: Don't import any oversized contacts</li>
              <li>• Continue anyway: Import all contacts (not recommended)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="default"
            onClick={handleSkipSelected}
            disabled={selectedContacts.size === 0}
            className="flex-1"
          >
            Skip Selected ({selectedContacts.size})
          </Button>
          <Button
            variant="outline"
            onClick={() => onDecision('skip-all')}
            className="flex-1"
          >
            Skip All
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDecision('continue')}
            className="flex-1"
          >
            Continue Anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}