import { anthropic } from "@ai-sdk/anthropic"
import { streamObject } from "ai"
import { z } from "zod"

// Schema for the response
const searchResponseSchema = z.object({
  matches: z.array(
    z.object({
      contactId: z.string(),
      reason: z.string(),
    })
  )
})

export async function POST(req: Request) {
  try {
    const { query, contacts } = await req.json()
    
    if (!query || !contacts) {
      return new Response(
        JSON.stringify({ error: "Query and contacts are required" }), 
        { status: 400 }
      )
    }

    // Use first 500 contacts only
    const contactsToSearch = contacts.slice(0, 500)
    const prompt = createSearchPrompt(query, contactsToSearch)

    // Stream the response
    const result = await streamObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
      schema: searchResponseSchema,
      prompt: prompt,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Error in search API:", error)
    return new Response(
      JSON.stringify({ error: "Failed to process query" }), 
      { status: 500 }
    )
  }
}

interface Contact {
  id: string
  [key: string]: unknown
}

function createSearchPrompt(query: string, contacts: Contact[]) {
  return `You are a smart contact search assistant. Analyze the following contacts and return the best matches for the user's query.

QUERY: "${query}"

CONTACTS:
${JSON.stringify(contacts, null, 2)}

Return a JSON object with a 'matches' array containing objects with 'contactId' and 'reason' fields. Only include contacts that are highly relevant to the query.

Be specific about why each contact matches, including details like:
- Job titles and companies
- Skills and expertise
- Locations and timezones
- Any other relevant information from their profile

Respond ONLY with valid JSON.`
}