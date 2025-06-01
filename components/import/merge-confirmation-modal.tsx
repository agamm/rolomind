import React from 'react'
import { Contact } from '@/types/contact'
import { DuplicateMatch, mergeContacts } from '@/lib/contact-merger'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Calendar, AlertCircle, Link } from 'lucide-react'

interface MergeConfirmationModalProps {
  duplicate: DuplicateMatch | null
  onDecision: (action: 'merge' | 'skip' | 'keep-both' | 'cancel') => void
  remainingCount?: number
}

export function MergeConfirmationModal({ 
  duplicate, 
  onDecision,
  remainingCount 
}: MergeConfirmationModalProps) {
  if (!duplicate) return null
  
  const { existing, incoming, matchType, matchValue } = duplicate
  const merged = mergeContacts(existing, incoming)
  
  return (
    <Dialog open={!!duplicate} onOpenChange={(open) => {
      if (!open) onDecision('cancel')
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            <ContactCard contact={existing} />
          </div>
          
          {/* Incoming Contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              New Contact
            </h3>
            <ContactCard contact={incoming as Contact} isPartial />
          </div>
          
          {/* Merged Result */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-green-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              After Merge
            </h3>
            <ContactCard contact={merged} isMerged />
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onDecision('skip')}>
            Skip This Contact
          </Button>
          <Button variant="outline" onClick={() => onDecision('keep-both')}>
            Keep Both
          </Button>
          <Button onClick={() => onDecision('merge')} className="bg-green-600 hover:bg-green-700">
            Merge Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContactCard({ 
  contact, 
  isPartial = false,
  isMerged = false 
}: { 
  contact: Contact | Partial<Contact>
  isPartial?: boolean
  isMerged?: boolean 
}) {
  const bgClass = isMerged 
    ? 'bg-green-50 border-green-300 shadow-sm' 
    : isPartial 
    ? 'bg-blue-50 border-blue-200'
    : 'bg-gray-50 border-gray-200'
  
  return (
    <div className={`rounded-lg border-2 p-4 space-y-3 ${bgClass}`}>
      <div>
        <h4 className="font-medium text-gray-900">{contact.name || 'No name'}</h4>
        {contact.source && (
          <Badge variant="outline" className="text-xs mt-1">
            {contact.source}
          </Badge>
        )}
      </div>
      
      {contact.contactInfo && (
        <div className="space-y-2 text-sm">
          {contact.contactInfo.emails?.length > 0 && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="space-y-1">
                {contact.contactInfo.emails.map((email, i) => (
                  <div key={i} className="text-gray-600">{email}</div>
                ))}
              </div>
            </div>
          )}
          
          {contact.contactInfo.phones?.length > 0 && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="space-y-1">
                {contact.contactInfo.phones.map((phone, i) => (
                  <div key={i} className="text-gray-600">{phone}</div>
                ))}
              </div>
            </div>
          )}
          
          {contact.contactInfo.linkedinUrls?.length > 0 && (
            <div className="flex items-start gap-2">
              <Link className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="space-y-1">
                {contact.contactInfo.linkedinUrls.map((url, i) => (
                  <div key={i} className="text-gray-600 truncate">
                    {url.replace('https://www.linkedin.com/in/', '')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {contact.notes && (
        <div className="text-sm text-gray-600 bg-white rounded p-2 max-h-32 overflow-y-auto">
          <p className="whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}
      
      {contact.createdAt && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          {isPartial ? 'New' : new Date(contact.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}