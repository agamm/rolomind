import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
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

    const { query, summaries } = await request.json()

    if (!query || !summaries || !Array.isArray(summaries)) {
      return new Response(JSON.stringify({ error: "Query and summaries array are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (summaries.length === 0) {
      return Response.json({ 
        summary: "No matches found for your query.",
        success: true 
      })
    }

    if (summaries.length === 1) {
      return Response.json({ 
        summary: summaries[0],
        success: true 
      })
    }

    try {
      const { text } = await generateText({
        model: anthropic("claude-3-5-sonnet-20241022"),
        prompt: createMergingPrompt(query, summaries),
      })

      return Response.json({ 
        summary: text,
        success: true 
      })
    } catch (error) {
      console.error("Error merging summaries:", error)
      return new Response(JSON.stringify({ error: "Failed to merge summaries" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (error) {
    console.error("Error in merge-summaries API:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function createMergingPrompt(query: string, summaries: string[]) {
  return `You are an expert at analyzing and summarizing contact search results.

USER QUERY: "${query}"

CHUNK SUMMARIES:
${summaries.map((summary, i) => `Chunk ${i + 1}: ${summary}`).join('\n')}

Instructions:
1. Aggregate all numbers (e.g., if chunks found 2+3 CEOs, total is 5)
2. Extract key patterns across chunks
3. Answer the user's specific query
4. Be concise - maximum 3-4 sentences
5. Use simple language and clear numbers
6. DO NOT add any prefix like "COMPREHENSIVE SUMMARY" or similar

Respond with ONLY the summary content, nothing else.`
} 