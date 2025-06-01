"use client"

import React, { useState, useEffect } from 'react'
import { Contact } from '@/types/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { VoiceRecorder } from '@/components/ui/voice-recorder'
import { toast } from 'sonner'

interface EditContactModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedContact: Contact) => void
}

export function EditContactModal({ contact, isOpen, onClose, onSave }: EditContactModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error: recordingError
  } = useVoiceRecorder()

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        company: contact.company || '',
        role: contact.role || '',
        location: contact.location || '',
        notes: contact.notes || '',
        contactInfo: {
          emails: [...contact.contactInfo.emails],
          phones: [...contact.contactInfo.phones],
          linkedinUrls: [...contact.contactInfo.linkedinUrls]
        }
      })
    }
  }, [contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return

    setIsSaving(true)
    try {
      const updatedContact: Contact = {
        ...contact,
        ...formData,
        updatedAt: new Date()
      }
      
      await onSave(updatedContact)
      onClose()
    } catch (error) {
      console.error('Failed to save contact:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording and process
      setIsProcessingVoice(true)
      try {
        const audioBlob = await stopRecording()
        if (!audioBlob || !contact) return

        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.webm')
        formData.append('contact', JSON.stringify(contact))

        const response = await fetch('/api/voice-to-contact', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to process voice recording')
        }

        const { updatedContact, changes, transcription } = await response.json()
        
        // Update form data with the voice-extracted information
        setFormData(updatedContact)
        
        // Show transcription if available
        if (transcription && !transcription.includes('not configured')) {
          toast.success('Voice recording processed successfully')
          
          // Show what was extracted
          const extractedFields = []
          if (changes.name) extractedFields.push('name')
          if (changes.company) extractedFields.push('company')
          if (changes.role) extractedFields.push('role')
          if (changes.location) extractedFields.push('location')
          if (changes.emails?.length) extractedFields.push(`${changes.emails.length} email(s)`)
          if (changes.phones?.length) extractedFields.push(`${changes.phones.length} phone(s)`)
          if (changes.notesToAdd) extractedFields.push('notes')
          
          if (extractedFields.length > 0) {
            toast.info(`Updated: ${extractedFields.join(', ')}`)
          } else {
            toast.info('No changes detected in the recording')
          }
        } else {
          toast.warning('Voice transcription requires OpenAI API key configuration')
        }
      } catch (error) {
        console.error('Failed to process voice recording:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to process voice recording'
        toast.error(errorMessage)
      } finally {
        setIsProcessingVoice(false)
      }
    } else {
      // Start recording
      await startRecording()
    }
  }

  const handleContactInfoChange = (field: 'emails' | 'phones' | 'linkedinUrls', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: prev.contactInfo![field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const addContactInfoField = (field: 'emails' | 'phones' | 'linkedinUrls') => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: [...prev.contactInfo![field], '']
      }
    }))
  }

  const removeContactInfoField = (field: 'emails' | 'phones' | 'linkedinUrls', index: number) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: prev.contactInfo![field].filter((_, i) => i !== index)
      }
    }))
  }

  if (!contact) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Voice Recording Section */}
          <VoiceRecorder
            isRecording={isRecording}
            isPaused={isPaused}
            recordingTime={recordingTime}
            audioLevel={audioLevel}
            onStart={startRecording}
            onStop={handleVoiceRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            isProcessing={isProcessingVoice}
            error={recordingError}
          />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Email addresses */}
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {formData.contactInfo?.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => handleContactInfoChange('emails', index, e.target.value)}
                  placeholder="email@example.com"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeContactInfoField('emails', index)}
                  disabled={formData.contactInfo!.emails.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addContactInfoField('emails')}
            >
              Add Email
            </Button>
          </div>

          {/* Phone numbers */}
          <div className="space-y-2">
            <Label>Phone Numbers</Label>
            {formData.contactInfo?.phones.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => handleContactInfoChange('phones', index, e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeContactInfoField('phones', index)}
                  disabled={formData.contactInfo!.phones.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addContactInfoField('phones')}
            >
              Add Phone
            </Button>
          </div>

          {/* LinkedIn URLs */}
          <div className="space-y-2">
            <Label>LinkedIn URLs</Label>
            {formData.contactInfo?.linkedinUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => handleContactInfoChange('linkedinUrls', index, e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeContactInfoField('linkedinUrls', index)}
                  disabled={formData.contactInfo!.linkedinUrls.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addContactInfoField('linkedinUrls')}
            >
              Add LinkedIn URL
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Add any additional notes about this contact..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}