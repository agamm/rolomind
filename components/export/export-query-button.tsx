"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Contact } from '@/types/contact'

interface ExportQueryButtonProps {
  contacts: Contact[]
  disabled?: boolean
}

function escapeCsvField(field: string | undefined): string {
  if (!field) return ''
  // If field contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export function ExportQueryButton({ contacts, disabled }: ExportQueryButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  
  const handleExport = async () => {
    if (contacts.length === 0) {
      toast.error('No contacts to export')
      return
    }
    
    setIsExporting(true)
    
    try {
      // Create CSV header
      const headers = [
        'Name',
        'Company', 
        'Role',
        'Location',
        'Emails',
        'Phones',
        'LinkedIn URL',
        'Other URLs',
        'Notes',
        'Source',
        'Created Date',
        'Updated Date'
      ]
      
      // Convert contacts to CSV rows
      const rows = contacts.map(contact => {
        const otherUrls = contact.contactInfo.otherUrls
          ?.map(url => `${url.platform}: ${url.url}`)
          .join('; ')
        
        return [
          escapeCsvField(contact.name),
          escapeCsvField(contact.company),
          escapeCsvField(contact.role),
          escapeCsvField(contact.location),
          escapeCsvField(contact.contactInfo.emails.join('; ')),
          escapeCsvField(contact.contactInfo.phones.join('; ')),
          escapeCsvField(contact.contactInfo.linkedinUrl),
          escapeCsvField(otherUrls),
          escapeCsvField(contact.notes),
          escapeCsvField(contact.source),
          escapeCsvField(new Date(contact.createdAt).toISOString()),
          escapeCsvField(new Date(contact.updatedAt).toISOString())
        ]
      })
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv' })
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Exported ${contacts.length} contacts!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export contacts')
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <Button 
      onClick={handleExport}
      disabled={isExporting || disabled || contacts.length === 0}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export Results ({contacts.length})
        </>
      )}
    </Button>
  )
}