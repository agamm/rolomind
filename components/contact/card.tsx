"use client"

import React, { useState } from "react"
import type { Contact } from "@/types/contact"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, ExternalLink, Sparkles, ChevronDown, ChevronUp, Building2, Briefcase, MapPin, Edit2, Trash2 } from "lucide-react"

interface ContactCardProps {
  contact: Contact
  aiReason?: string
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  isSelected?: boolean
  onSelectToggle?: (contact: Contact) => void
  showCheckbox?: boolean
}

export function ContactCard({ contact, aiReason, onEdit, onDelete, isSelected, onSelectToggle, showCheckbox }: ContactCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const handleLinkedInClick = React.useCallback(() => {
    if (contact.contactInfo.linkedinUrl) {
      const url = contact.contactInfo.linkedinUrl
      // Ensure URL has protocol
      const linkedinUrl = url.startsWith("http") ? url : `https://${url}`
      window.open(linkedinUrl, "_blank", "noopener,noreferrer")
    }
  }, [contact.contactInfo.linkedinUrl])

  const handleEmailClick = React.useCallback(() => {
    if (contact.contactInfo.emails.length > 0) {
      window.open(`mailto:${contact.contactInfo.emails[0]}`, "_blank")
    }
  }, [contact.contactInfo.emails])

  const handlePhoneClick = React.useCallback(() => {
    if (contact.contactInfo.phones.length > 0) {
      window.open(`tel:${contact.contactInfo.phones[0]}`, "_blank")
    }
  }, [contact.contactInfo.phones])


  return (
    <div className={`contact-card ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={() => onSelectToggle?.(contact)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className="flex-1">
                <h3 className="contact-name">{contact.name}</h3>
            <div className="flex items-center gap-2">
              <span className="organic-badge">
                {contact.source}
              </span>

              {contact.contactInfo.linkedinUrl && (
                <button
                  onClick={handleLinkedInClick}
                  className="inline-flex items-center text-primary hover:text-primary/80 cursor-pointer"
                  title="Open LinkedIn Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(contact)}
                className="h-8 w-8 p-0 cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                title="Edit contact"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(contact)}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                title="Delete contact"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Professional Info - Each property on new line */}
        <div className="mb-3 space-y-1">
          {contact.company && (
            <div className="contact-detail">
              <Building2 />
              {contact.company}
            </div>
          )}
          {contact.role && (
            <div className="contact-detail">
              <Briefcase />
              {contact.role}
            </div>
          )}
          {contact.location && (
            <div className="contact-detail">
              <MapPin />
              {contact.location}
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {contact.contactInfo.emails.length > 0 && (
            <button
              onClick={handleEmailClick}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors w-full text-left"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate">{contact.contactInfo.emails[0]}</span>
            </button>
          )}

          {contact.contactInfo.phones.length > 0 && (
            <button
              onClick={handlePhoneClick}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors w-full text-left"
            >
              <Phone className="w-4 h-4" />
              <span>{contact.contactInfo.phones[0]}</span>
            </button>
          )}

          {/* Show notes with expand/collapse functionality */}
          {contact.notes && (
            <div className="space-y-2">
              <div className="text-gray-600 text-xs bg-gray-50 p-3 rounded-md border border-gray-200">
                {(() => {
                  
                  // For structured data, show full notes if expanded, otherwise show excerpt
                  // For unstructured notes, always show them with expand option if long
                  const noteLines = contact.notes.split('\n').filter(Boolean)
                  const isLong = noteLines.length > 3 || contact.notes.length > 150
                  
                  if (isExpanded || !isLong) {
                    return <span className="whitespace-pre-wrap">{contact.notes}</span>
                  } else {
                    // Show excerpt
                    const excerpt = noteLines.slice(0, 3).join('\n')
                    const truncated = excerpt.length > 150 ? excerpt.substring(0, 150) + '...' : excerpt
                    return (
                      <>
                        <span className="whitespace-pre-wrap">{truncated}</span>
                        {noteLines.length > 3 && <span className="text-gray-400">...</span>}
                      </>
                    )
                  }
                })()}
              </div>
              
              {/* Show expand button if notes are long */}
              {(contact.notes.split('\n').filter(Boolean).length > 3 || contact.notes.length > 150) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-1 h-auto text-xs cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show all notes
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {aiReason && (
          <div className="mt-3 ai-glow">
            <div className="flex items-start gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-primary mb-1">AI Match</p>
                <p className="text-xs text-subtle">{aiReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t text-xs text-subtle">
          Added {contact.createdAt instanceof Date ? contact.createdAt.toLocaleDateString() : new Date(contact.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}