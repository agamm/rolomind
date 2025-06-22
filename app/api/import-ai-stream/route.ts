import { NextRequest } from "next/server"
import Papa from 'papaparse'
import * as linkedinParser from "../import/parsers/linkedin-parser"
import * as rolodexParser from "../import/parsers/rolodex-parser"
import * as googleParser from "../import/parsers/google-parser"
import { Contact } from '@/types/contact'
import { createJsonStream } from '@/lib/stream-utils'
import { getServerSession, getUserCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'

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
  } else if (googleParser.isApplicableParser(headers)) {
    parserUsed = 'google'
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
    // Check authentication first
    const session = await getServerSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    // Check if user has enough credits for AI normalization
    const credits = await getUserCredits();
    const requiredCredits = Math.ceil(rows.length / 100) * CreditCost.IMPORT_CONTACTS;
    
    if (!credits || credits.remaining < requiredCredits) {
      return new Response(JSON.stringify({ 
        error: `Insufficient credits for AI normalization. Need ${requiredCredits} credits but only have ${credits?.remaining || 0}.`,
        required: requiredCredits,
        remaining: credits?.remaining || 0
      }), { status: 402 });
    }

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
            const { normalizeContactWithLLM } = await import('../import/parsers/llm-normalizer')
            return await normalizeContactWithLLM(row, headers)
          } catch (error) {
            console.error('Failed to normalize contact:', error)
            return null
          }
        })
        
        const results = await Promise.all(promises)
        
        for (const contact of results) {
          if (contact) {
            normalizedContacts.push(contact as Contact)
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
      
      // Yield final result with normalized contacts
      yield {
        type: 'complete',
        processed: {
          total: totalRows,
          normalized: normalizedContacts.length
        },
        contacts: normalizedContacts,
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
  } else if (parserUsed === 'google') {
    contacts = googleParser.parse(text)
  }
  
  return new Response(JSON.stringify({
    success: true,
    phase: 'complete',
    processed: {
      total: rows.length,
      normalized: contacts.length
    },
    contacts,
    parserUsed
  }))
}