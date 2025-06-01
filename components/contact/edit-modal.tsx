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

interface EditContactModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedContact: Contact) => void
}

export function EditContactModal({ contact, isOpen, onClose, onSave }: EditContactModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({})
  const [isSaving, setIsSaving] = useState(false)

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