import { anthropic } from "@ai-sdk/anthropic"
import { streamObject } from "ai"
import { z } from "zod"
import type { NextRequest } from "next/server"

// Define the simplified schema for our AI response
const contactMatchSchema = z.object({
  contactId: z.string().min(1),
  reason: z.string().min(1),
})

const searchResponseSchema = z.object({
  matches: z.array(contactMatchSchema),
})

export async function POST(request: NextRequest) {
  try {
    const { query, contacts } = await request.json()

    if (!query || !contacts) {
      return new Response(JSON.stringify({ error: "Query and contacts are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Set up response as a ReadableStream
    const encoder = new TextEncoder()

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Create the streaming object
            const { partialObjectStream } = streamObject({
              model: anthropic("claude-3-5-sonnet-20241022"),
              schema: searchResponseSchema,
              prompt: createDetailedPrompt(query, contacts),
              maxTokens: 4000,
            })

            // Stream the data
            for await (const partialObject of partialObjectStream) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "matches",
                    ...partialObject,
                  })}\n\n`,
                ),
              )
            }

            controller.close()
          } catch (error) {
            console.error("Streaming error:", error)
            controller.error(error)
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      },
    )
  } catch (error) {
    console.error("Error in search API:", error)
    return new Response(JSON.stringify({ error: "Failed to process query" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function createDetailedPrompt(query: string, contacts: Record<string, unknown>[]) {
  return `You are a smart contact search assistant. Your job is to find contacts that match the user's query and explain why each contact is relevant.

USER QUERY: "${query}"

CONTACTS:
###
${JSON.stringify(contacts, null, 2)}
###

Instructions:
1. Think carefully about what the user is looking for in their query
2. Search through all contact fields: names, emails, companies, positions, locations, notes
3. For each matching contact, provide a SPECIFIC and DETAILED reason why they match
4. IMPORTANT: NEVER use generic phrases like "This contact matches your search criteria" - always be specific about WHY they match
5. Include exact matching information in your reason, such as:
   - "Their position as 'Software Engineer at Google' matches your search for tech professionals"
   - "Their location in 'San Francisco' matches your search for Bay Area contacts"
   - "Their email domain 'microsoft.com' indicates they work at Microsoft"
   - "Their notes mention 'blockchain experience' which matches your query"

Respond with JSON in this exact format:
{
  "matches": [
    {
      "contactId": "contact-id-here",
      "reason": "Specific explanation of why this contact matches the query, citing exact matching information"
    }
  ]
}

Think carefully about the query and find the most relevant contacts. Respond ONLY with valid JSON.`
}
