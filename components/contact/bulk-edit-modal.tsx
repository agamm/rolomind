"use client"

import React, { useState, useEffect } from 'react'
import { Contact } from '@/types/contact'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { EditContactModal } from './edit-modal'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface BulkEditModalProps {
  contacts: Contact[]
  isOpen: boolean
  onClose: () => void
  onSave: (updatedContact: Contact) => void
  onDelete?: (contact: Contact) => void
}

export function BulkEditModal({ contacts, isOpen, onClose, onSave, onDelete }: BulkEditModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editedContacts, setEditedContacts] = useState<Set<string>>(new Set())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const currentContact = contacts[currentIndex]
  const totalContacts = contacts.length
  const progress = ((currentIndex + 1) / totalContacts) * 100

  useEffect(() => {
    if (isOpen && totalContacts > 0) {
      setCurrentIndex(0)
      setEditedContacts(new Set())
      setIsEditModalOpen(true)
    }
  }, [isOpen, totalContacts])

  const handleSave = (updatedContact: Contact) => {
    onSave(updatedContact)
    setEditedContacts(prev => new Set(prev).add(updatedContact.id))
    
    // Auto-advance to next contact after save
    if (currentIndex < totalContacts - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // All contacts processed
      toast.success(`Successfully edited ${editedContacts.size + 1} contacts`)
      onClose()
    }
  }

  const handleSkip = () => {
    if (currentIndex < totalContacts - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      toast.success(`Successfully edited ${editedContacts.size} contacts`)
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleEditModalClose = () => {
    // Don't close the edit modal, instead handle it as skip
    handleSkip()
  }

  if (!isOpen || !currentContact) return null

  // Show only the edit modal when it's open
  if (isEditModalOpen) {
    return (
      <EditContactModal
        contact={currentContact}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSave={handleSave}
        onDelete={onDelete}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Contacts</DialogTitle>
          <DialogDescription>
            Editing {totalContacts} contacts
          </DialogDescription>
        </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Contact {currentIndex + 1} of {totalContacts}</span>
                <span>{editedContacts.size} edited</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="px-4 text-center">
                <p className="font-medium">{currentContact.name}</p>
                <p className="text-sm text-gray-500">
                  {currentContact.company || 'No company'}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
              >
                Skip
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Check className="h-4 w-4 text-green-500" />
              <span>Changes are saved automatically after each edit</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel Bulk Edit
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)}>
              Edit Current Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}