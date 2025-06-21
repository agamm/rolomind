import { NextRequest, NextResponse } from "next/server"
import { generateObject } from 'ai'
import { z } from 'zod'
import type { Contact } from '@/types/contact'
import { openrouter } from '@/lib/openrouter-config'
import { getServerSession, consumeCredits, getUserCredits } from '@/lib/auth/server'
import { CreditCost } from '@/lib/credit-costs'
import { TOKEN_LIMITS, checkTokenLimit } from '@/lib/token-utils'

const mergedContactSchema = z.object({
  name: z.string().describe('The most complete and accurate name - NEVER use placeholder values'),
  company: z.string().optional().describe('Company name - ONLY real company names, not UNKNOWN/N/A/placeholders'),
  role: z.string().optional().describe('Job title/role - ONLY real roles, not UNKNOWN/N/A/placeholders'),
  location: z.string().optional().describe('Location - ONLY real locations, not <UNKNOWN>/N/A/placeholders'),
  contactInfo: z.object({
    phones: z.array(z.string()).describe('All unique REAL phone numbers - no placeholders'),
    emails: z.array(z.string()).describe('All unique REAL email addresses - no placeholders'),
    linkedinUrl: z.string().optional().describe('LinkedIn URL - keep the most complete one'),
    otherUrls: z.array(z.object({
      platform: z.string(),
      url: z.string()
    })).describe('Other social/professional URLs')
  }),
  notes: z.string().describe('Merged notes - combine meaningfully, remove duplicates of structured fields (company, role, location) that are already captured above, keep ALL other valuable information including connection dates, meeting notes, and any other context')
})

export async function POST(request: NextRequest) {
  try {
    const { existing, incoming } = await request.json()
    
    if (!existing || !incoming) {
      return NextResponse.json({ 
        success: false, 
        error: "Both existing and incoming contacts are required" 
      }, { status: 400 })
    }

    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has enough credits
    const credits = await getUserCredits();
    if (!credits || credits.remaining < CreditCost.MERGE_CONTACTS) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient credits. Please add more credits to continue.',
          required: CreditCost.MERGE_CONTACTS,
          remaining: credits?.remaining || 0
        },
        { status: 402 }
      )
    }

    const promptText = `Merge these two contact records intelligently. 
      
Existing contact:
${JSON.stringify((() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ...rest } = existing;
  return rest;
})(), null, 2)}

Incoming contact:
${JSON.stringify((() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ...rest } = incoming;
  return rest;
})(), null, 2)}

Instructions:
1. Keep the most complete and accurate information from both contacts
2. Combine all contact methods (phones, emails, LinkedIn) without duplicates
3. CRITICAL: For ALL fields (name, company, role, location, emails, phones, notes, etc.), NEVER include placeholder values:
   - If a field only contains placeholders like UNKNOWN, <UNKNOWN>, N/A, <N/A>, None, null, undefined, or empty strings, leave that field empty/undefined
   - Examples: 
     * If location is "<UNKNOWN>" in one contact and empty in another, the merged location should be undefined (not "<UNKNOWN>")
     * If company is "N/A" in one contact and "Google" in another, the merged company should be "Google"
     * If role is "Unknown" in both contacts, the merged role should be undefined
4. For structured fields (company, role, location):
   - Only use real values, not placeholders
   - If both contacts have placeholders or one has placeholder and other is empty, leave the field undefined
   - If one has a real value and other has placeholder, use the real value
5. For notes:
   - Combine all unique information from both contacts
   - Remove any information that duplicates the structured fields (company, role, location)
   - KEEP LinkedIn connection dates (e.g., "LinkedIn connected: January 2024") as they provide valuable context
   - If the notes mention when a contact was imported/added and from what source, preserve this information - but don't duplicate dates and sources.
   - If no year is provided to a date in the notes, add the current year to it: ${new Date().getFullYear()}
   - Identify and merge similar/duplicate notes that express the same information (even with slight variations in wording, spelling, or capitalization)
   - For example: "Said he would like to meet for coffee when I'm in NYC" and "Said he would like to meet for coffee when I'm in NyC" should be merged into a single note
   - When merging similar notes, keep the version with better spelling/grammar or more detail
   - Keep all truly unique observations, meeting notes, or personal information
   - Format the notes cleanly, one piece of information per line (list items with "-" preferred)
   - Do not repeat the same information multiple times, even if worded slightly differently
   - Do not include any lines that only contain placeholder values
6. Preserve the best version of the name (longer/more complete is usually better)`;

    try {
      checkTokenLimit(promptText, TOKEN_LIMITS.MERGE_CONTACTS.input, 'merge-contacts');
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ 
          success: false, 
          error: "Contact data is too large to merge. Please reduce the size of notes or other fields.",
          details: error.message
        }, { status: 400 })
      }
      throw error;
    }

    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3.7-sonnet'),
      schema: mergedContactSchema,
      maxTokens: TOKEN_LIMITS.MERGE_CONTACTS.output,
      prompt: promptText
    })

    await consumeCredits(CreditCost.MERGE_CONTACTS);

    const mergedContact: Contact = {
      id: existing.id,
      name: object.name,
      company: object.company,
      role: object.role,
      location: object.location,
      contactInfo: object.contactInfo,
      notes: object.notes || '',
      source: existing.source,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    }

    return NextResponse.json({ 
      success: true,
      mergedContact
    })
  } catch (error) {
    console.error("Error merging contacts:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to merge contacts" 
    }, { status: 500 })
  }
}