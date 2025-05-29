import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "AI service not configured" 
        }), 
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { query, foundContacts } = await request.json()

    if (!query || !foundContacts || foundContacts.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Query and found contacts are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Generate summary using AI
    const { text } = await generateText({
      model: anthropic("claude-3-5-sonnet-20241022"),
      prompt: `You are analyzing search results for contacts.

USER QUERY: "${query}"

FOUND CONTACTS (${foundContacts.length} total):
${JSON.stringify(foundContacts, null, 2)}

Create a concise 2-3 sentence summary that:
1. States how many contacts were found
2. Identifies key patterns (e.g., common companies, locations, roles)
3. Provides any other relevant insights about the results

Focus on facts and be specific. Example format:
"Found 12 contacts matching your search. Most work in technology companies (8 from Google, Microsoft, and Apple) with software engineering roles. The majority are based in California (7) and New York (3)."

Write ONLY the summary, no other text.`,
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: text 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error generating summary:", error)
    return new Response(JSON.stringify({ 
      error: "Failed to generate summary" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
} 