"use client"

import React, { useState } from "react"
import type { Contact } from "@/types/contact"
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
    <div className={`contact-card group ${isSelected ? 'ring-2 ring-gray-900' : ''}`}>
      <div className="relative">
        {/* Action buttons - show on hover */}
        <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

        {/* Primary section - Name and LinkedIn */}
        <div className="mb-3">
          <div className="flex items-start gap-3">
            {showCheckbox && (
              <input
                type="checkbox"
                checked={isSelected || false}
                onChange={() => onSelectToggle?.(contact)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{contact.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(10, 102, 194, 0.1)', color: '#0A66C2' }}>
                  {contact.source}
                </span>
                {contact.contactInfo.linkedinUrl && (
                  <button
                    onClick={handleLinkedInClick}
                    className="inline-flex items-center cursor-pointer transition-colors"
                    style={{ color: '#0A66C2' }}
                    title="Open LinkedIn Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary section - Professional Info */}
        <div className="mb-3 space-y-1.5 pl-1">
          {contact.role && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{contact.role}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{contact.company}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{contact.location}</span>
            </div>
          )}
        </div>

        {/* Show contact info and notes if they exist */}
        {(contact.contactInfo.emails.length > 0 || contact.contactInfo.phones.length > 0) && (
          <div className="mb-3 pt-3 border-t border-gray-100">
            <div className="space-y-1.5">
              {contact.contactInfo.emails.length > 0 && (
                <button
                  onClick={handleEmailClick}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors w-full text-left group"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-sm truncate">{contact.contactInfo.emails[0]}</span>
                </button>
              )}

              {contact.contactInfo.phones.length > 0 && (
                <button
                  onClick={handlePhoneClick}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors w-full text-left group"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-sm">{contact.contactInfo.phones[0]}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes section - Expandable */}
        {contact.notes && (
          <div className="space-y-2 mb-4">
            <div className="bg-zinc-50 p-3 rounded-lg border border-gray-100">
              <div className="text-sm text-gray-900">
                {(() => {
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
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {aiReason && (
          <div className="ai-glow mb-4">
            <div className="flex items-start gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-purple-900 mb-1">AI Match</p>
                <p className="text-xs text-purple-700">{aiReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata - Footer */}
        <div className="pt-2 text-xs text-gray-400">
          Added {contact.createdAt instanceof Date ? contact.createdAt.toLocaleDateString() : new Date(contact.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}