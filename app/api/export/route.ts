import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { Contact } from "@/types/contact"

function escapeCsvField(field: string | undefined): string {
  if (!field) return ''
  // If field contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'contacts.json')
    const fileContent = await readFile(filePath, 'utf-8')
    const contacts: Contact[] = JSON.parse(fileContent)
    
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
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
}