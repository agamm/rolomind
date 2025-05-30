"use client"

import React from "react"
import type { Contact } from "@/types/contact"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, ExternalLink, Briefcase, Calendar, MapPin, Sparkles } from "lucide-react"

interface ContactCardProps {
  contact: Contact
  aiReason?: string
}

export function ContactCard({ contact, aiReason }: ContactCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
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
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
                  title="Open LinkedIn Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Professional Info */}
        {(extractedInfo.company || extractedInfo.position || extractedInfo.location || extractedInfo.connectedOn) && (
          <div className="mb-3 space-y-1.5">
            {(extractedInfo.position || extractedInfo.company) && (
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Briefcase className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span>
                  {extractedInfo.position && <span>{extractedInfo.position}</span>}
                  {extractedInfo.position && extractedInfo.company && <span> at </span>}
                  {extractedInfo.company && <span className="font-medium">{extractedInfo.company}</span>}
                </span>
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