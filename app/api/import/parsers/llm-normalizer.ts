import { generateObject } from 'ai'
import { z } from 'zod'
import { Contact, RawContactData } from '@/types/contact'
import { v4 as uuidv4 } from 'uuid'
import { openrouter } from '@/lib/openrouter-config'
import { TOKEN_LIMITS, checkTokenLimit } from '@/lib/token-utils'

const normalizedContactSchema = z.object({
  name: z.string().describe('Full name of the contact'),
  phones: z.array(z.string()).describe('Phone numbers, normalized to include country code if possible'),
  emails: z.array(z.string()).describe('Email addresses'),
  linkedinUrl: z.string().optional().describe('LinkedIn profile URL'),
  company: z.string().optional().describe('Company name'),
  role: z.string().optional().describe('Job title, position or role'),
  location: z.string().optional().describe('Location, city, or address'),
  notes: z.string().optional().describe('Any additional notes or information that does not fit in other fields')
})

export async function normalizeContactWithLLM(
  rawData: RawContactData,
  headers: string[]
): Promise<Partial<Contact>> {
  try {
    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.')
    }

    const promptText = `Extract and normalize contact information from this CSV row data.

Headers: ${headers.join(', ')}
Data: ${JSON.stringify(rawData, null, 2)}

Instructions:
1. Extract the person's full name
2. Extract all phone numbers (normalize to include country codes if evident from context)
3. Extract all email addresses
4. Extract the LinkedIn URL if available (look for linkedin.com URLs or profile identifiers)
5. Extract company name if available
6. Extract job title/position/role if available
7. Extract location (city, state, country) if available
8. Put any other relevant information into notes (but NOT company, role, or location)

Be thorough in extracting all available contact information.`;

    try {
      checkTokenLimit(promptText, TOKEN_LIMITS.IMPORT_CONTACT.input, 'import-contact');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Contact data too large: ${error.message}`);
      }
      throw error;
    }

    const { object } = await generateObject({
      model: openrouter('anthropic/claude-3-haiku'),
      schema: normalizedContactSchema,
      maxTokens: TOKEN_LIMITS.IMPORT_CONTACT.output,
      prompt: promptText
    })

    const contact: Partial<Contact> = {
      id: uuidv4(),
      name: object.name,
      company: object.company,
      role: object.role,
      location: object.location,
      contactInfo: {
        phones: object.phones || [],
        emails: object.emails || [],
        linkedinUrl: object.linkedinUrl,
        otherUrls: []
      },
      notes: object.notes || '',
      source: 'manual' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return contact
  } catch (error) {
    console.error('LLM normalization error:', error)
    throw new Error(`Failed to normalize contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function normalizeCsvBatch(
  rows: RawContactData[],
  headers: string[]
): Promise<{ normalized: Contact[], errors: string[] }> {
  const normalized: Contact[] = []
  const errors: string[] = []
  
  console.log('LLM normalizer - starting batch processing for', rows.length, 'rows')
  console.log('LLM normalizer - headers:', headers)
  
  // Process in small batches to avoid rate limits
  const BATCH_SIZE = 5
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    console.log(`LLM normalizer - processing batch ${i / BATCH_SIZE + 1}, rows ${i + 1}-${i + batch.length}`)
    
    const promises = batch.map(async (row, index) => {
      try {
        const contact = await normalizeContactWithLLM(row, headers)
        return { success: true, contact, index: i + index }
      } catch (error) {
        console.error(`LLM normalizer - error on row ${i + index + 1}:`, error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          index: i + index 
        }
      }
    })
    
    const results = await Promise.all(promises)
    
    for (const result of results) {
      if (result.success && result.contact) {
        normalized.push(result.contact as Contact)
      } else if (!result.success) {
        errors.push(`Row ${result.index + 2}: ${result.error}`)
      }
    }
    
    console.log(`LLM normalizer - batch complete, normalized ${normalized.length} contacts so far`)
    
    // Add delay between batches to avoid rate limits
    if (i + BATCH_SIZE < rows.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  console.log('LLM normalizer - complete. Normalized:', normalized.length, 'Errors:', errors.length)
  
  return { normalized, errors }
}