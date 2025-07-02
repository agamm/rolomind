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
import { Loader2, Plus, X, Trash2, AlertTriangle } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/use-voice-recorder'
import { VoiceRecorder } from '@/components/ui/voice-recorder'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getContactTokenCount, CONTACT_LIMITS } from '@/lib/config'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EditContactModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedContact: Contact) => void
  onDelete?: (contact: Contact) => void
}

export function EditContactModal({ contact, isOpen, onClose, onSave, onDelete }: EditContactModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set())
  const [tokenCount, setTokenCount] = useState(0)
  
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
          linkedinUrl: contact.contactInfo.linkedinUrl || '',
          otherUrls: [...(contact.contactInfo.otherUrls || [])]
        }
      })
      // Clear highlights when switching contacts
      setUpdatedFields(new Set())
      // Calculate initial token count
      setTokenCount(getContactTokenCount(contact))
    }
  }, [contact])

  // Update token count when form data changes
  useEffect(() => {
    if (contact && formData.name) {
      const tempContact: Contact = {
        ...contact,
        ...formData,
        updatedAt: contact.updatedAt
      }
      setTokenCount(getContactTokenCount(tempContact))
    }
  }, [formData, contact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact) return

    // Check token limit before saving
    if (tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT) {
      toast.error(`Contact exceeds the ${CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} token limit. Please reduce the content, especially in the notes field.`)
      return
    }

    setIsSaving(true)
    try {
      const updatedContact: Contact = {
        ...contact,
        ...formData,
        updatedAt: new Date()
      }
      
      onSave(updatedContact)
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

        const formDataToSend = new FormData()
        formDataToSend.append('audio', audioBlob, 'recording.webm')
        
        // Use current form data with in-memory values instead of saved contact
        const currentContact: Contact = {
          ...contact,
          ...formData,
          updatedAt: contact.updatedAt
        }
        formDataToSend.append('contact', JSON.stringify(currentContact))

        const response = await fetch('/api/voice-to-contact', {
          method: 'POST',
          body: formDataToSend
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to process voice recording')
        }

        const { updatedContact, changes, transcription } = await response.json()
        
        // Track which fields were updated
        const newUpdatedFields = new Set<string>()
        
        // Check for changes and update form data - compare against current form data
        if (changes.name && changes.name !== formData.name) newUpdatedFields.add('name')
        if (changes.company && changes.company !== formData.company) newUpdatedFields.add('company')
        if (changes.role && changes.role !== formData.role) newUpdatedFields.add('role')
        if (changes.location && changes.location !== formData.location) newUpdatedFields.add('location')
        if (changes.linkedinUrl && changes.linkedinUrl !== formData.contactInfo?.linkedinUrl) newUpdatedFields.add('linkedinUrl')
        if (changes.emails?.length) {
          changes.emails.forEach((_: string, index: number) => {
            newUpdatedFields.add(`email-${updatedContact.contactInfo.emails.length - changes.emails.length + index}`)
          })
        }
        if (changes.phones?.length) {
          changes.phones.forEach((_: string, index: number) => {
            newUpdatedFields.add(`phone-${updatedContact.contactInfo.phones.length - changes.phones.length + index}`)
          })
        }
        if (changes.otherUrls?.length) {
          changes.otherUrls.forEach((_: { platform: string; url: string }, index: number) => {
            newUpdatedFields.add(`otherUrl-${updatedContact.contactInfo.otherUrls.length - changes.otherUrls.length + index}`)
          })
        }
        if (changes.notesComplete) newUpdatedFields.add('notes')
        
        setUpdatedFields(newUpdatedFields)
        
        // Update form data with the voice-extracted information
        setFormData({
          name: updatedContact.name,
          company: updatedContact.company || '',
          role: updatedContact.role || '',
          location: updatedContact.location || '',
          notes: updatedContact.notes || '',
          contactInfo: {
            emails: [...updatedContact.contactInfo.emails],
            phones: [...updatedContact.contactInfo.phones],
            linkedinUrl: updatedContact.contactInfo.linkedinUrl || '',
            otherUrls: [...(updatedContact.contactInfo.otherUrls || [])]
          }
        })
        
        // Show transcription if available
        if (transcription && !transcription.includes('not configured')) {
          toast.success('Voice recording processed - highlighted fields were updated')
          
          // Show what was extracted
          const extractedFields = []
          if (changes.name) extractedFields.push('name')
          if (changes.company) extractedFields.push('company')
          if (changes.role) extractedFields.push('role')
          if (changes.location) extractedFields.push('location')
          if (changes.emails?.length) extractedFields.push(`${changes.emails.length} email(s)`)
          if (changes.phones?.length) extractedFields.push(`${changes.phones.length} phone(s)`)
          if (changes.notesComplete) extractedFields.push('notes')
          
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

  const handleArrayFieldChange = (field: 'emails' | 'phones', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: prev.contactInfo![field].map((item, i) => i === index ? value : item)
      }
    }))
  }

  const addArrayField = (field: 'emails' | 'phones') => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: [...prev.contactInfo![field], '']
      }
    }))
  }

  const removeArrayField = (field: 'emails' | 'phones', index: number) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        [field]: prev.contactInfo![field].filter((_, i) => i !== index)
      }
    }))
  }

  const handleOtherUrlChange = (index: number, field: 'platform' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        otherUrls: prev.contactInfo!.otherUrls.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }))
  }

  const addOtherUrl = () => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        otherUrls: [...prev.contactInfo!.otherUrls, { platform: '', url: '' }]
      }
    }))
  }

  const removeOtherUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo!,
        otherUrls: prev.contactInfo!.otherUrls.filter((_, i) => i !== index)
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
          {/* Token Limit Warning */}
          {tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This contact exceeds the {CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} token limit ({tokenCount} tokens).
                Please reduce the content to save changes.
              </AlertDescription>
            </Alert>
          )}
          
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
              className={cn(
                updatedFields.has('name') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company || ''}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className={cn(
                updatedFields.has('company') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={cn(
                updatedFields.has('role') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={cn(
                updatedFields.has('location') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          {/* Email addresses */}
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {formData.contactInfo?.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => handleArrayFieldChange('emails', index, e.target.value)}
                  placeholder="email@example.com"
                  className={cn(
                    updatedFields.has(`email-${index}`) && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayField('emails', index)}
                  disabled={formData.contactInfo!.emails.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('emails')}
            >
              <Plus className="mr-2 h-4 w-4" />
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
                  onChange={(e) => handleArrayFieldChange('phones', index, e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={cn(
                    updatedFields.has(`phone-${index}`) && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayField('phones', index)}
                  disabled={formData.contactInfo!.phones.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField('phones')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Phone
            </Button>
          </div>

          {/* LinkedIn URL */}
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              value={formData.contactInfo?.linkedinUrl || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contactInfo: {
                  ...prev.contactInfo!,
                  linkedinUrl: e.target.value
                }
              }))}
              placeholder="https://linkedin.com/in/username"
              className={cn(
                updatedFields.has('linkedinUrl') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          {/* Other URLs */}
          <div className="space-y-2">
            <Label>Other Social Media / Websites</Label>
            {formData.contactInfo?.otherUrls.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item.platform}
                  onChange={(e) => handleOtherUrlChange(index, 'platform', e.target.value)}
                  placeholder="Platform (e.g., Twitter)"
                  className={cn(
                    "w-1/3",
                    updatedFields.has(`otherUrl-${index}`) && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
                  )}
                />
                <Input
                  value={item.url}
                  onChange={(e) => handleOtherUrlChange(index, 'url', e.target.value)}
                  placeholder="URL"
                  className={cn(
                    "flex-1",
                    updatedFields.has(`otherUrl-${index}`) && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeOtherUrl(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOtherUrl}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add URL
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <span className={cn(
                "text-xs",
                tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT 
                  ? "text-amber-600 dark:text-amber-400 font-medium" 
                  : "text-muted-foreground"
              )}>
                {tokenCount} / {CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT} tokens
              </span>
            </div>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Add any additional notes about this contact..."
              className={cn(
                updatedFields.has('notes') && "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
              )}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (contact) {
                      onDelete(contact)
                      onClose()
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || tokenCount > CONTACT_LIMITS.MAX_TOKENS_PER_CONTACT}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}