import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { openrouter } from '@/lib/openrouter-config'
import { getServerSession, trackCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'

const summarySchema = z.object({
  summary: z.string().describe('A concise 2-3 sentence summary with key numbers and findings'),
  keyInsights: z.array(z.string()).describe('3-4 key insights from the search results').max(4),
  totalMatches: z.number().describe('Total number of matching contacts')
})

export async function POST(request: NextRequest) {
  try {
    const { contacts, query } = await request.json()
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts provided' },
        { status: 400 }
      )
    }
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }
    
    interface ContactMatch {
      contact: {
        name: string
        email: string
        company: string
        title: string
        location: string
      }
      reason: string
    }
    
    const contactSummaries = contacts.map((match: ContactMatch) => ({
      name: match.contact.name,
      email: match.contact.email,
      company: match.contact.company,
      title: match.contact.title,
      location: match.contact.location,
      reason: match.reason
    }))
    
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.7-sonnet'),
      schema: summarySchema,
      prompt: `Analyze these ${contacts.length} contacts that match the query "${query}".
      
Contacts found:
${JSON.stringify(contactSummaries, null, 2)}

Provide:
1. A concise 2-3 sentence summary with the most important findings and numbers
2. 3-4 key insights (patterns, trends, or notable findings)
3. Total number of matches

Be concise and highlight the most important information that answers the user's query.`
    })
    
    await trackCredits(CreditCost.CLAUDE_3_7_SONNET);
    
    return NextResponse.json(object)
  } catch (error) {
    console.error('Summary generation error:', error)
    
    const errorMessage = error instanceof Error ? error.message : ''
    if (errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}