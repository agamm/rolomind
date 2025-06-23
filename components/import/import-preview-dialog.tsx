import React, { useEffect, useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { FileText, Sparkles, Users, Mail, Phone, MapPin, Building, Link, ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Contact } from '@/types/contact'

interface ImportPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  csvHeaders: string[]
  sampleRow?: Record<string, string>
  parserType: 'linkedin' | 'rolodex' | 'google' | 'custom' | 'llm-normalizer'
  rowCount?: number
}

export function ImportPreviewDialog({
  isOpen,
  onClose,
  onConfirm,
  csvHeaders,
  sampleRow,
  parserType,
  rowCount = 0
}: ImportPreviewDialogProps) {
  const [previewContact, setPreviewContact] = useState<Partial<Contact> | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const isAINormalization = parserType === 'custom' || parserType === 'llm-normalizer'
  
  const getFormatName = () => {
    switch (parserType) {
      case 'linkedin': return 'LinkedIn Export'
      case 'rolodex': return 'Rolomind Export'
      case 'google': return 'Google Contacts'
      default: return 'AI-Powered Import'
    }
  }

  // Fetch preview from actual parser when dialog opens
  useEffect(() => {
    if (isOpen && sampleRow && csvHeaders.length > 0 && !previewContact && !isLoadingPreview) {
      setIsLoadingPreview(true)
      
      fetch('/api/import-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: csvHeaders,
          sampleRow,
          parserType
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.previewContact) {
          setPreviewContact(data.previewContact)
        }
      })
      .catch(error => {
        console.error('Failed to load preview:', error)
      })
      .finally(() => {
        setIsLoadingPreview(false)
      })
    }
  }, [isOpen, sampleRow, csvHeaders, parserType, previewContact, isLoadingPreview])

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPreviewContact(null)
    }
  }, [isOpen])

  // Convert parsed contact to display format
  const getContactFields = () => {
    if (!previewContact) return []
    
    const fields: { field: string; value: string; icon: React.ReactNode }[] = []
    
    if (previewContact.name) {
      fields.push({
        field: 'Name',
        value: previewContact.name,
        icon: <Users className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.contactInfo?.emails && previewContact.contactInfo.emails.length > 0) {
      fields.push({
        field: 'Email',
        value: previewContact.contactInfo.emails.join(', '),
        icon: <Mail className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.contactInfo?.phones && previewContact.contactInfo.phones.length > 0) {
      fields.push({
        field: 'Phone',
        value: previewContact.contactInfo.phones.join(', '),
        icon: <Phone className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.company) {
      fields.push({
        field: 'Company',
        value: previewContact.company,
        icon: <Building className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.role) {
      fields.push({
        field: 'Role',
        value: previewContact.role,
        icon: <Users className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.location) {
      fields.push({
        field: 'Location',
        value: previewContact.location,
        icon: <MapPin className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.contactInfo?.linkedinUrl) {
      fields.push({
        field: 'LinkedIn',
        value: previewContact.contactInfo.linkedinUrl,
        icon: <Link className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    if (previewContact.notes) {
      fields.push({
        field: 'Notes',
        value: previewContact.notes,
        icon: <FileText className="h-3 w-3 text-muted-foreground" />
      })
    }
    
    return fields
  }
  
  const contactFields = getContactFields()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            {getFormatName()} - {rowCount} contact{rowCount !== 1 ? 's' : ''} detected
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* CSV Table Preview */}
          {sampleRow && csvHeaders.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Your spreadsheet data:</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {csvHeaders.slice(0, 6).map((header, index) => (
                        <th key={index} className="text-left text-xs font-medium text-muted-foreground px-2 py-1">
                          {header}
                        </th>
                      ))}
                      {csvHeaders.length > 6 && (
                        <th className="text-left text-xs font-medium text-muted-foreground px-2 py-1">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      {csvHeaders.slice(0, 6).map((header, index) => (
                        <td key={index} className="text-xs px-2 py-2">
                          <div className="max-w-[120px] truncate">
                            {sampleRow[header] || '-'}
                          </div>
                        </td>
                      ))}
                      {csvHeaders.length > 6 && (
                        <td className="text-xs px-2 py-2 text-muted-foreground">...</td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Mapping Arrow */}
          {isAINormalization && (
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center gap-1">
                <ArrowDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-3 w-3" />
                  <span>AI will extract and normalize</span>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Contact Preview */}
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating preview...</span>
              </div>
            </div>
          ) : contactFields.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">How we&apos;ll import your data:</div>
              <div className="bg-muted rounded-lg p-3 space-y-2">
                {contactFields.map((field, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    {field.icon}
                    <div className="flex-1">
                      <span className="font-medium">{field.field}:</span>{' '}
                      <span className="text-muted-foreground">
                        {field.value.length > 60 ? field.value.substring(0, 60) + '...' : field.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* What will be imported - generic list */
            <div className="space-y-2">
              <div className="text-sm font-medium">We&apos;ll import:</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>Names</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Building className="h-3 w-3 text-muted-foreground" />
                  <span>Companies</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>Emails</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>Phones</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>Locations</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Link className="h-3 w-3 text-muted-foreground" />
                  <span>URLs</span>
                </div>
              </div>
            </div>
          )}

        </div>
        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} size="sm" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            size="sm" 
            className="flex-1"
            disabled={isLoadingPreview}
          >
            {isLoadingPreview ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading preview...
              </>
            ) : (
              'Start importing...'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}