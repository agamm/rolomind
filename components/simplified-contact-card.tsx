"use client"

import React from "react"
import type { Contact } from "@/types/contact"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Mail, Phone, Linkedin, Sparkles, Briefcase, Calendar, MapPin } from "lucide-react"

interface SimplifiedContactCardProps {
  contact: Contact
  onDelete: (id: string) => void
  isAiResult?: boolean
  aiReason?: string
}

export const SimplifiedContactCard = React.memo(function SimplifiedContactCard({
  contact,
  onDelete,
  isAiResult = false,
  aiReason,
}: SimplifiedContactCardProps) {
  const handleDelete = React.useCallback(() => {
    onDelete(contact.id)
  }, [contact.id, onDelete])

  const handleLinkedInClick = React.useCallback(() => {
    if (contact.contactInfo.linkedinUrls.length > 0) {
      const url = contact.contactInfo.linkedinUrls[0]
      // Ensure URL has protocol
      const linkedinUrl = url.startsWith("http") ? url : `https://${url}`
      window.open(linkedinUrl, "_blank", "noopener,noreferrer")
    }
  }, [contact.contactInfo.linkedinUrls])

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

  // Extract company, position, location, and connection date from notes
  const extractedInfo = React.useMemo(() => {
    const info = {
      company: "",
      position: "",
      location: "",
      connectedOn: "",
    }

    if (!contact.notes) return info

    // Extract information using regex
    const companyMatch = contact.notes.match(/Company: ([^;]+)/)
    const positionMatch = contact.notes.match(/Position: ([^;]+)/)
    const locationMatch = contact.notes.match(/Location: ([^;]+)/)
    const connectedMatch = contact.notes.match(/Connected: ([^;]+)/)

    if (companyMatch) info.company = companyMatch[1].trim()
    if (positionMatch) info.position = positionMatch[1].trim()
    if (locationMatch) info.location = locationMatch[1].trim()
    if (connectedMatch) info.connectedOn = connectedMatch[1].trim()

    return info
  }, [contact.notes])

  return (
    <Card className={`hover:shadow-md transition-shadow ${isAiResult ? "border-purple-200 bg-purple-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">{contact.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={contact.source === "linkedin" ? "default" : "secondary"} className="text-xs">
                {contact.source}
              </Badge>

              {contact.contactInfo.linkedinUrls.length > 0 && (
                <button
                  onClick={handleLinkedInClick}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  title="Open LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {!isAiResult && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-gray-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* AI Reasoning - Always show when it's an AI result */}
        {isAiResult && (
          <div className="mb-3 p-2 bg-purple-100 rounded-md border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-800 leading-relaxed">
                {aiReason || "Matched based on your search criteria"}
              </p>
            </div>
          </div>
        )}

        {/* Professional Info */}
        {(extractedInfo.company || extractedInfo.position || extractedInfo.location || extractedInfo.connectedOn) && (
          <div className="mb-3 space-y-1.5">
            {extractedInfo.position && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Briefcase className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span>{extractedInfo.position}</span>
              </div>
            )}

            {extractedInfo.company && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-3 h-3 flex-shrink-0" /> {/* Spacer for alignment */}
                <span className="font-medium">{extractedInfo.company}</span>
              </div>
            )}

            {extractedInfo.location && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span>{extractedInfo.location}</span>
              </div>
            )}

            {extractedInfo.connectedOn && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Calendar className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span>Connected on {extractedInfo.connectedOn}</span>
              </div>
            )}
          </div>
        )}

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

          {/* Only show raw notes if they contain information not already extracted */}
          {contact.notes &&
            !contact.notes.includes("Company:") &&
            !contact.notes.includes("Position:") &&
            !contact.notes.includes("Location:") &&
            !contact.notes.includes("Connected:") && (
              <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded">
                {contact.notes.length > 100 ? `${contact.notes.substring(0, 100)}...` : contact.notes}
              </div>
            )}
        </div>

        <div className="mt-3 pt-3 border-t text-xs text-gray-500">Added {contact.createdAt.toLocaleDateString()}</div>
      </CardContent>
    </Card>
  )
})
