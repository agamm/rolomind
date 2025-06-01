#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'
import type { Contact } from '../types/contact'

const dataFilePath = path.join(process.cwd(), 'data', 'contacts.json')

async function migrateContacts() {
  try {
    // Read existing contacts
    const data = await fs.readFile(dataFilePath, 'utf-8')
    const contacts: Contact[] = JSON.parse(data)
    
    console.log(`Migrating ${contacts.length} contacts...`)
    
    // Migrate each contact
    const migratedContacts = contacts.map((contact: any) => {
      // Initialize new fields if they don't exist
      const migrated: Contact = {
        ...contact,
        company: contact.company || undefined,
        role: contact.role || undefined,
        location: contact.location || undefined,
      }
      
      // Extract structured data from notes if fields are empty
      if (contact.notes && (!migrated.company || !migrated.role || !migrated.location)) {
        const companyMatch = contact.notes.match(/Company:\s*([^;,\n]+)/i)
        const positionMatch = contact.notes.match(/Position:\s*([^;,\n]+)/i)
        const titleMatch = contact.notes.match(/Title:\s*([^;,\n]+)/i)
        const locationMatch = contact.notes.match(/Location:\s*([^;,\n]+)/i)
        
        if (!migrated.company && companyMatch) {
          migrated.company = companyMatch[1].trim()
        }
        
        if (!migrated.role) {
          if (positionMatch) {
            migrated.role = positionMatch[1].trim()
          } else if (titleMatch) {
            migrated.role = titleMatch[1].trim()
          }
        }
        
        if (!migrated.location && locationMatch) {
          migrated.location = locationMatch[1].trim()
        }
        
        // Clean up notes by removing extracted fields
        if (migrated.company || migrated.role || migrated.location) {
          let cleanedNotes = migrated.notes
          
          // Remove extracted fields from notes
          cleanedNotes = cleanedNotes.replace(/Company:\s*[^;,\n]+[;,]?\s*/gi, '')
          cleanedNotes = cleanedNotes.replace(/Position:\s*[^;,\n]+[;,]?\s*/gi, '')
          cleanedNotes = cleanedNotes.replace(/Title:\s*[^;,\n]+[;,]?\s*/gi, '')
          cleanedNotes = cleanedNotes.replace(/Location:\s*[^;,\n]+[;,]?\s*/gi, '')
          
          // Clean up multiple newlines and semicolons
          cleanedNotes = cleanedNotes.replace(/;\s*;/g, ';')
          cleanedNotes = cleanedNotes.replace(/^\s*;\s*/g, '')
          cleanedNotes = cleanedNotes.replace(/\s*;\s*$/g, '')
          cleanedNotes = cleanedNotes.replace(/\n\s*\n/g, '\n')
          cleanedNotes = cleanedNotes.trim()
          
          migrated.notes = cleanedNotes
        }
      }
      
      return migrated
    })
    
    // Write back the migrated contacts
    await fs.writeFile(dataFilePath, JSON.stringify(migratedContacts, null, 2))
    
    console.log('Migration completed successfully!')
    
    // Show some stats
    const withCompany = migratedContacts.filter(c => c.company).length
    const withRole = migratedContacts.filter(c => c.role).length
    const withLocation = migratedContacts.filter(c => c.location).length
    
    console.log(`Contacts with company: ${withCompany}`)
    console.log(`Contacts with role: ${withRole}`)
    console.log(`Contacts with location: ${withLocation}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateContacts()