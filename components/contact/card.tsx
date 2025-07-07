"use client"

import React, { useState } from "react"
import type { Contact } from "@/types/contact"
import { Button } from "@/components/ui/button"
import { Mail, Phone, ExternalLink, Sparkles, ChevronDown, ChevronUp, Building2, Briefcase, MapPin, Edit2, Trash2, Globe } from "lucide-react"

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
  const [isContactInfoExpanded, setIsContactInfoExpanded] = useState(false)
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
      window.location.href = `mailto:${contact.contactInfo.emails[0]}`
    }
  }, [contact.contactInfo.emails])

  const handlePhoneClick = React.useCallback(() => {
    if (contact.contactInfo.phones.length > 0) {
      window.open(`tel:${contact.contactInfo.phones[0]}`, "_blank")
    }
  }, [contact.contactInfo.phones])

  const handleWebsiteClick = React.useCallback((url: string) => {
    const websiteUrl = url.startsWith("http") ? url : `https://${url}`
    window.open(websiteUrl, "_blank", "noopener,noreferrer")
  }, [])


  return (
    <div className={`contact-card group ${isSelected ? 'ring-2 ring-gray-900 dark:ring-gray-100' : ''}`}>
      <div className="relative">
        {/* Action buttons - show on hover */}
        <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(contact)}
              className="h-8 w-8 p-0 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              className="h-8 w-8 p-0 text-red-400 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
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
                className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-gray-100"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{contact.name}</h3>
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
        <div className="mb-3 space-y-1.5">
          {contact.role && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-4">{contact.role}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 leading-4">{contact.company}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 leading-4">{contact.location}</span>
            </div>
          )}
        </div>

        {/* Contact info toggle button */}
        {(contact.contactInfo.emails.length > 0 || contact.contactInfo.phones.length > 0 || 
          contact.contactInfo.otherUrls.some(item => item.platform && item.url) || contact.notes) && (
          <div className="mb-3">
            <button
              onClick={() => setIsContactInfoExpanded(!isContactInfoExpanded)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 transition-all cursor-pointer rounded-md"
            >
              {isContactInfoExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show details
                </>
              )}
            </button>
          </div>
        )}

        {/* Show contact info and notes if they exist */}
        {isContactInfoExpanded && (contact.contactInfo.emails.length > 0 || contact.contactInfo.phones.length > 0 || 
          contact.contactInfo.otherUrls.some(item => item.platform && item.url)) && (
          <div className="mb-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-1.5">
              {contact.contactInfo.emails.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 w-full">
                  <button
                    onClick={handleEmailClick}
                    className="flex items-center justify-center w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title="Send email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm truncate select-text leading-4">{contact.contactInfo.emails[0]}</span>
                </div>
              )}

              {contact.contactInfo.phones.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 w-full">
                  <button
                    onClick={handlePhoneClick}
                    className="flex items-center justify-center w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title="Call phone"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm select-text leading-4">{contact.contactInfo.phones[0]}</span>
                </div>
              )}

              {/* Other social links and websites from otherUrls */}
              {contact.contactInfo.otherUrls.filter(item => 
                item.platform && item.url
              ).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 w-full">
                  <button
                    onClick={() => handleWebsiteClick(item.url)}
                    className="flex items-center justify-center w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    title={`Open ${item.platform}`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm truncate select-text leading-4">{item.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes section - Expandable */}
        {isContactInfoExpanded && contact.notes && (
          <div className="space-y-2 mb-4">
            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-gray-100 dark:border-zinc-700">
              <div className="text-sm text-gray-900 dark:text-zinc-100">
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
                  className="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 cursor-pointer"
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

        {isContactInfoExpanded && aiReason && (
          <div className="ai-glow mb-4">
            <div className="flex items-start gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-purple-900 dark:text-purple-200 mb-1">AI Match</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">{aiReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata - Footer */}
        <div className="pt-2 text-xs text-gray-400 dark:text-gray-500">
          Added {contact.createdAt instanceof Date ? contact.createdAt.toLocaleDateString() : new Date(contact.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}