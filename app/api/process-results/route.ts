import { NextRequest, NextResponse } from "next/server"
import { generateObject } from 'ai'
import { z } from 'zod'
import { Contact } from "@/types/contact"
import { openrouter } from '@/lib/openrouter-config'
import { getServerSession, consumeCredits, getUserCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'
import { TOKEN_LIMITS, checkTokenLimit } from '@/lib/token-utils'

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
  try {
    const { query, results } = await request.json() as ProcessRequest
    
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

    // Check if user has enough credits
    const credits = await getUserCredits();
    if (!credits || credits.remaining < CreditCost.PROCESS_RESULTS) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits. Please add more credits to continue.',
          required: CreditCost.PROCESS_RESULTS,
          remaining: credits?.remaining || 0
        },
        { status: 402 }
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
2. Determine if any results don't actually match the query and should be filtered out
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
      checkTokenLimit(promptText, TOKEN_LIMITS.PROCESS_RESULTS.input, 'process-results');
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ 
          sortedResults: results,
          processingNote: "Too many results to process. Showing original order.",
          error: error.message
        })
      }
      throw error;
    }

    const { object: response } = await generateObject({
      model: openrouter('anthropic/claude-3.7-sonnet'),
      schema: responseSchema,
      maxTokens: TOKEN_LIMITS.PROCESS_RESULTS.output,
      prompt: promptText
    })
    
    await consumeCredits(CreditCost.PROCESS_RESULTS);
    
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
    console.error('Process results error:', error)
    return NextResponse.json(
      { error: 'Failed to process results' },
      { status: 500 }
    )
  }
}