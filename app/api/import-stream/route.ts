import { NextRequest } from "next/server"
import Papa from 'papaparse'
import { CSVParserFactory } from '@/lib/csv-parsers'
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
  const rows = parseResult.data as any[]
  
  // Detect parser type
  const factory = new CSVParserFactory()
  let parserUsed = 'llm-normalizer' // default
  
  try {
    // Try to detect if it's LinkedIn or another known format
    for (const row of headers) {
      if (row && ['First Name', 'Last Name', 'Company', 'Position', 'Connected On'].some(h => row.includes(h))) {
        parserUsed = 'linkedin'
        break
      }
    }
  } catch (error) {
    console.log('Using LLM normalizer as fallback')
  }
  
  if (phase === 'detect') {
    return new Response(JSON.stringify({
      success: true,
      phase: 'detection',
      parserUsed,
      rowCount: rows.length
    }))
  }

  // Stream processing for LLM normalizer
  if (parserUsed === 'llm-normalizer') {
    async function* generateProgress() {
      const BATCH_SIZE = 5
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
  
  // For non-LLM parsers, use regular parsing
  const { contacts } = factory.detectAndParse(text)
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