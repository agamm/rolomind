import { anthropic } from "@ai-sdk/anthropic"
import { streamObject } from "ai"
import { z } from "zod"
import type { NextRequest } from "next/server"

// Simplified schema - only contacts
const contactMatchSchema = z.object({
  contactId: z.string().min(1),
  reason: z.string().min(1),
})

const searchResponseSchema = z.object({
  matches: z.array(contactMatchSchema),
})

// Process contacts in chunks to avoid token limits
const CHUNK_SIZE = 500

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set in environment variables")
      return new Response(
        JSON.stringify({ 
          error: "AI service not configured. Please set ANTHROPIC_API_KEY in your .env file" 
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

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
            // Process contacts in chunks
            const chunks = []
            for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
              chunks.push(contacts.slice(i, i + CHUNK_SIZE))
            }

            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i]

              try {
                // Create the streaming object for this chunk
                const { partialObjectStream } = streamObject({
                  model: anthropic("claude-3-5-sonnet-20241022"),
                  schema: searchResponseSchema,
                  prompt: createSearchPrompt(query, chunk),
                })

                const sentMatches = new Set<string>()

                // Stream the matches from this chunk
                for await (const partialObject of partialObjectStream) {
                  if (partialObject.matches && partialObject.matches.length > 0) {
                    // Filter out matches that have already been sent
                    const newMatches = partialObject.matches.filter(match => 
                      match && match.contactId && match.reason && !sentMatches.has(match.contactId)
                    )
                    
                    if (newMatches.length > 0) {
                      newMatches.forEach(match => {
                        if (match && match.contactId) {
                          sentMatches.add(match.contactId)
                        }
                      })
                      
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "matches",
                            matches: newMatches,
                          })}\n\n`,
                        ),
                      )
                    }
                  }
                }

              } catch (chunkError) {
                console.error(`Error processing chunk ${i + 1}:`, chunkError)
                
                // Send error information to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "error",
                      error: `Failed to process chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`,
                    })}\n\n`,
                  ),
                )
              }
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

function createSearchPrompt(query: string, contacts: Record<string, unknown>[]) {
  return `You are a smart contact search assistant. Your job is to find contacts that match the user's query and explain why each contact is relevant.

USER QUERY: "${query}"

CONTACTS:
###
${JSON.stringify(contacts, null, 2)}
###

Instructions:
1. Think carefully about what the user is looking for
2. For each matching contact, provide a SPECIFIC and DETAILED reason why they match
3. Be specific about WHY they match, including exact information like:
   - Job titles, company names, locations
   - Email domains, skills mentioned
   - Any other relevant matching details
4. Only return contacts from the provided list above
5. Only include contacts that strongly match the query

Respond with JSON in this exact format:
{
  "matches": [
    {
      "contactId": "contact-id-here",
      "reason": "Specific explanation citing exact matching information"
    }
  ]
}

Respond ONLY with valid JSON.`
}