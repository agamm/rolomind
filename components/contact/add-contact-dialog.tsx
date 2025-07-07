"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { saveContact } from "@/hooks/use-local-contacts"
import type { Contact } from "@/types/contact"
import { Plus, X } from "lucide-react"

interface AddContactDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddContactDialog({ isOpen, onClose, onSuccess }: AddContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    role: "",
    location: "",
    phones: [""],
    emails: [""],
    linkedinUrl: "",
    notes: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: "phones" | "emails", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayField = (field: "phones" | "emails") => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const removeArrayField = (field: "phones" | "emails", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    setIsLoading(true)
    
    try {
      const contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        company: formData.company.trim() || undefined,
        role: formData.role.trim() || undefined,
        location: formData.location.trim() || undefined,
        contactInfo: {
          phones: formData.phones.filter(phone => phone.trim()),
          emails: formData.emails.filter(email => email.trim()),
          linkedinUrl: formData.linkedinUrl.trim() || undefined,
          otherUrls: []
        },
        notes: formData.notes.trim(),
        source: "manual"
      }

      await saveContact(contact as Contact)
      
      toast.success("Contact added successfully")
      
      // Reset form
      setFormData({
        name: "",
        company: "",
        role: "",
        location: "",
        phones: [""],
        emails: [""],
        linkedinUrl: "",
        notes: ""
      })
      
      onSuccess?.()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add contact")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Acme Corp"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                placeholder="CEO"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="San Francisco, CA"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Emails</Label>
            {formData.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => handleArrayChange("emails", index, e.target.value)}
                  placeholder="john@example.com"
                  disabled={isLoading}
                  type="email"
                />
                {formData.emails.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField("emails", index)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField("emails")}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Email
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Phone Numbers</Label>
            {formData.phones.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => handleArrayChange("phones", index, e.target.value)}
                  placeholder="+1-555-123-4567"
                  disabled={isLoading}
                />
                {formData.phones.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayField("phones", index)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayField("phones")}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Phone
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              disabled={isLoading}
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Additional notes about this contact..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}