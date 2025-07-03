import { NextRequest, NextResponse } from "next/server"
import { generateObject } from 'ai'
import { z } from 'zod'
import { Contact } from "@/types/contact"
import { getServerSession } from '@/lib/auth/server'
import { getAIModel } from '@/lib/ai-client'

interface ContactMatch {
  contact: Contact
  reason: string
}

interface ProcessRequest {
  query: string
  results: ContactMatch[]
}

interface ProcessedResult {
  sortedResults: ContactMatch[]
  processingNote?: string
}

export async function POST(request: NextRequest) {
  let results: ContactMatch[] = [];
  
  try {
    const requestData = await request.json() as ProcessRequest;
    const { query } = requestData;
    results = requestData.results;
    
    if (!query || !results || results.length === 0) {
      return NextResponse.json({ 
        sortedResults: results || [],
        processingNote: "No results to process" 
      })
    }

    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }


    // Create a simplified list for the AI to work with
    const simplifiedResults = results.map((result, index) => ({
      index,
      name: result.contact.name,
      company: result.contact.company,
      role: result.contact.role,
      location: result.contact.location,
      linkedinDate: result.contact.notes.match(/LinkedIn connected: (.+)/)?.[1] || '',
      createdAt: result.contact.createdAt,
      reason: result.reason
    }))

    const responseSchema = z.object({
      sortedIndices: z.array(z.number()),
      filteredOutIndices: z.array(z.number()),
      sortingNote: z.string()
    })

    const promptText = `You are an AI assistant that helps sort and clean contact search results based on user queries.
    
Your task is to:
1. Analyze the user's query to understand if they requested specific sorting (e.g., "oldest first", "by date", "most recent")
2. Determine if any results don't actually match the query and should be filtered out (don't allow implied or invented reasons)
    - Look for explicit reasoning.
    - Don't allow inference or invented reasoning.
    - Don't allow "other contacts suggest" or "network indicates" reasoning.
    - Every contact is a separate entity, don't combine or merge information from multiple contacts.
3. Return the indices of the contacts in the correct order

If the query mentions temporal sorting like "oldest first" or sorting by connection date, prioritize the linkedinDate field.
If no specific sorting is requested, keep the original order but filter out any clearly irrelevant results.

User query: "${query}"

Contacts found:
${simplifiedResults.map((r, i) => 
  `${i}: ${r.name} - ${r.company} (${r.role}) - ${r.location}${r.linkedinDate ? ` - Connected: ${r.linkedinDate}` : ''} - Reason: ${r.reason}`
).join('\n')}

Please analyze if sorting is needed based on the query, and filter out any irrelevant results.

Return:
- sortedIndices: array of indices in the correct order
- filteredOutIndices: array of indices to remove
- sortingNote: Brief explanation of how you sorted/filtered`;

    try {
      const model = await getAIModel('anthropic/claude-3.7-sonnet');
      
      const { object: response } = await generateObject({
        model: model,
        schema: responseSchema,
        maxTokens: 1000,
        prompt: promptText
      })
      
      // Apply the sorting and filtering
      const sortedIndices = response.sortedIndices || []
      const filteredOutIndices = new Set(response.filteredOutIndices || [])
      
      // Create the sorted results
      const sortedResults: ContactMatch[] = []
      for (const index of sortedIndices) {
        if (!filteredOutIndices.has(index) && results[index]) {
          sortedResults.push(results[index])
        }
      }
      
      // If no sorting was provided, just filter
      if (sortedIndices.length === 0) {
        results.forEach((result, index) => {
          if (!filteredOutIndices.has(index)) {
            sortedResults.push(result)
          }
        })
      }

      return NextResponse.json({
        sortedResults,
        processingNote: response.sortingNote || undefined
      } as ProcessedResult)
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key not configured')) {
        return NextResponse.json({ 
          sortedResults: results,
          processingNote: 'AI service not configured. Showing original order.'
        } as ProcessedResult)
      }
      throw error;
    }

  } catch (error) {
    console.error('Process results error:', error)
    // If AI processing fails, return original results
    return NextResponse.json({
      sortedResults: results,
      processingNote: 'AI processing failed. Showing original order.'
    } as ProcessedResult)
  }
}