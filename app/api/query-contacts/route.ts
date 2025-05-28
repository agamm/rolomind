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
                  prompt: createDetailedPrompt(query, chunk),
                })

                const sentMatches = new Set<string>()

                // Stream the data from this chunk
                for await (const partialObject of partialObjectStream) {
                  if (partialObject.matches && partialObject.matches.length > 0) {
                    // Send complete matches (ensure reason is a complete sentence)
                    const completeMatches = partialObject.matches.filter(match => {
                      if (!match || !match.contactId || !match.reason) return false
                      // Only send if reason ends with punctuation (complete sentence)
                      return match.reason.match(/[.!?]$/)
                    })
                    
                    if (completeMatches.length > 0) {
                      // Remove already sent matches
                      const newMatches = completeMatches.filter(match => 
                        match && match.contactId && !sentMatches.has(match.contactId)
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
                              chunkIndex: i,
                              totalChunks: chunks.length,
                            })}\n\n`,
                          ),
                        )
                      }
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
                      chunkIndex: i,
                      totalChunks: chunks.length,
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

function createDetailedPrompt(query: string, contacts: Record<string, unknown>[]) {
  return `You are a smart contact search assistant. Your job is to find contacts that match the user's query and explain why each contact is relevant.

USER QUERY: "${query}"

CONTACTS:
###
${JSON.stringify(contacts, null, 2)}
###

Instructions:
1. Think carefully about what the user is looking for in their query
2. For each matching contact, provide a SPECIFIC and DETAILED reason why they match
3. IMPORTANT: NEVER use generic phrases like "This contact matches your search criteria" - always be specific about WHY they match
4. Include exact matching information in your reason, such as:
   - "Their position as 'Software Engineer at Google' matches your search for tech professionals"
   - "Their location in 'San Francisco' matches your search for Bay Area contacts"
   - "Their email domain 'microsoft.com' indicates they work at Microsoft"
   - "Their notes mention 'blockchain experience' which matches your query"
5. Don't invent contacts, only return contacts from the contacts above.
6. Don't include contacts that don't match the query in a strong way.

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