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
}

export function ContactCard({ contact, aiReason, onEdit, onDelete }: ContactCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{contact.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={contact.source === "linkedin" ? "default" : "secondary"} className="text-xs">
                {contact.source}
              </Badge>

              {contact.contactInfo.linkedinUrl && (
                <button
                  onClick={handleLinkedInClick}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
                  title="Open LinkedIn Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(contact)}
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete contact"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Professional Info - Each property on new line */}
        <div className="mb-3 space-y-1 text-sm">
          {contact.company && (
            <div className="text-gray-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              {contact.company}
            </div>
          )}
          {contact.role && (
            <div className="text-gray-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-gray-500" />
              {contact.role}
            </div>
          )}
          {contact.location && (
            <div className="text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              {contact.location}
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {contact.contactInfo.emails.length > 0 && (
            <button
              onClick={handleEmailClick}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors w-full text-left"
            >
              <Mail className="w-4 h-4" />
              <span className="truncate">{contact.contactInfo.emails[0]}</span>
            </button>
          )}

          {contact.contactInfo.phones.length > 0 && (
            <button
              onClick={handlePhoneClick}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors w-full text-left"
            >
              <Phone className="w-4 h-4" />
              <span>{contact.contactInfo.phones[0]}</span>
            </button>
          )}

          {/* Show notes with expand/collapse functionality */}
          {contact.notes && (
            <div className="space-y-2">
              <div className="text-gray-600 text-xs bg-gray-100 p-3 rounded-md border border-gray-200">
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
                  className="w-full py-1 h-auto text-xs"
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
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 mb-1">AI Match</p>
                <p className="text-xs text-blue-800">{aiReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          Added {contact.createdAt instanceof Date ? contact.createdAt.toLocaleDateString() : new Date(contact.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
}