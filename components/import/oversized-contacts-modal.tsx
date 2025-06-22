import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Oversized Contacts Detected
          </DialogTitle>
          <DialogDescription>
            {oversizedContacts.length} contact{oversizedContacts.length > 1 ? 's' : ''} exceed the {CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} token limit and may cause issues with AI processing.
          </DialogDescription>
        </DialogHeader>

        <Alert className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Large contacts consume more credits and may fail during AI operations. Consider removing unnecessary information from notes or splitting into multiple contacts.
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[300px] border rounded-lg p-4">
          <div className="space-y-3">
            {oversizedContacts.map((item) => (
              <div
                key={item.index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedContacts.has(item.index)
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => toggleContact(item.index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(item.index)}
                        onChange={() => toggleContact(item.index)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.contact.company && `${item.contact.company} • `}
                          {item.contact.role}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 ml-6">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {item.tokenCount} tokens ({Math.round((item.tokenCount / CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) * 100)}% of limit)
                        </span>
                        {item.originalTokenCount && item.originalTokenCount !== item.tokenCount && (
                          <span className="text-muted-foreground">
                            (was {item.originalTokenCount} tokens)
                          </span>
                        )}
                        {item.contact.notes && (
                          <span className="text-muted-foreground">
                            Notes: {item.contact.notes.length} characters
                          </span>
                        )}
                      </div>
                      {item.contact.notes && item.contact.notes.length > 200 && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {item.contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="text-sm text-muted-foreground">
          {selectedContacts.size} of {oversizedContacts.length} contacts selected to skip
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onDecision('skip-all')}
          >
            Skip All Oversized
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipSelected}
            disabled={selectedContacts.size === 0}
          >
            Skip Selected ({selectedContacts.size})
          </Button>
          <Button
            onClick={() => onDecision('continue')}
            variant="default"
          >
            Import All Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}