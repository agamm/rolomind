import { NextRequest } from "next/server"
import Papa from 'papaparse'
import * as linkedinParser from "@/lib/csv-parsers/linkedin-parser"
import * as rolodexParser from "@/lib/csv-parsers/rolodex-parser"
import { Contact } from '@/types/contact'
import { loadExistingContacts } from '@/lib/contacts-storage'
import { findDuplicates } from '@/lib/contact-merger'
import { createJsonStream } from '@/lib/stream-utils'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const phase = request.nextUrl.searchParams.get('phase')
  
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }

  const text = await file.text()
  const parseResult = Papa.parse(text, { header: true })
  const headers = parseResult.meta.fields || []
  const rows = parseResult.data as Record<string, string>[]
  
  // Detect parser type
  let parserUsed = 'custom' // default
  
  if (rolodexParser.isApplicableParser(headers)) {
    parserUsed = 'rolodex'
  } else if (linkedinParser.isApplicableParser(headers)) {
    parserUsed = 'linkedin'
  }
  
  if (phase === 'detect') {
    return new Response(JSON.stringify({
      success: true,
      phase: 'detection',
      parserUsed,
      rowCount: rows.length
    }))
  }

  // Stream processing for custom parser (AI)
  if (parserUsed === 'custom') {
    async function* generateProgress() {
      const BATCH_SIZE = 50
      const totalRows = rows.length
      let processed = 0
      const normalizedContacts: Contact[] = []
      
      // Yield initial progress
      yield { type: 'progress', current: 0, total: totalRows }
      
      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        const batch = rows.slice(i, Math.min(i + BATCH_SIZE, totalRows))
        
        // Process batch
        const promises = batch.map(async (row) => {
          try {
            const { normalizeContactWithLLM } = await import('@/lib/csv-parsers/llm-normalizer')
            return await normalizeContactWithLLM(row, headers)
          } catch (error) {
            console.error('Failed to normalize contact:', error)
            return null
          }
        })
        
        const results = await Promise.all(promises)
        
        for (const contact of results) {
          if (contact) {
            normalizedContacts.push(contact)
            processed++
            // Yield progress update
            yield { type: 'progress', current: processed, total: totalRows }
          }
        }
        
        // Add delay between batches to avoid rate limits
        if (i + BATCH_SIZE < totalRows) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Load existing contacts and find duplicates
      const existingContacts = await loadExistingContacts()
      
      const contactsWithDuplicates = normalizedContacts.map(contact => {
        const duplicates = findDuplicates(existingContacts, contact)
        return { contact, duplicates }
      })
      
      const uniqueContacts = contactsWithDuplicates
        .filter(item => item.duplicates.length === 0)
        .map(item => item.contact)
      
      const duplicatesFound = contactsWithDuplicates
        .filter(item => item.duplicates.length > 0)
        .flatMap(item => item.duplicates)
      
      // Yield final result
      yield {
        type: 'complete',
        processed: {
          total: totalRows,
          normalized: normalizedContacts.length,
          unique: uniqueContacts.length,
          duplicates: duplicatesFound.length
        },
        uniqueContacts,
        duplicates: duplicatesFound,
        parserUsed
      }
    }
    
    return createJsonStream(generateProgress)
  }
  
  // For non-custom parsers, use regular parsing
  let contacts: Contact[] = []
  
  if (parserUsed === 'rolodex') {
    contacts = rolodexParser.parse(text)
  } else if (parserUsed === 'linkedin') {
    contacts = linkedinParser.parse(text)
  }
  
  const existingContacts = await loadExistingContacts()
  
  const contactsWithDuplicates = contacts.map(contact => {
    const duplicates = findDuplicates(existingContacts, contact)
    return { contact, duplicates }
  })
  
  const uniqueContacts = contactsWithDuplicates
    .filter(item => item.duplicates.length === 0)
    .map(item => item.contact)
  
  const duplicatesFound = contactsWithDuplicates
    .filter(item => item.duplicates.length > 0)
    .flatMap(item => item.duplicates)
  
  return new Response(JSON.stringify({
    success: true,
    phase: 'complete',
    processed: {
      total: rows.length,
      normalized: contacts.length,
      unique: uniqueContacts.length,
      duplicates: duplicatesFound.length
    },
    uniqueContacts,
    duplicates: duplicatesFound,
    parserUsed
  }))
}