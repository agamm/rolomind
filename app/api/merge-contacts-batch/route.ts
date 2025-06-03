import { NextRequest, NextResponse } from "next/server"
import { Contact } from "@/types/contact"
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const MergedContactSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.object({
    emails: z.array(z.string()),
    phones: z.array(z.string()),
    linkedinUrl: z.string().optional(),
    otherUrls: z.array(z.object({
      platform: z.string(),
      url: z.string()
    }))
  }),
  notes: z.string()
})

const BatchMergeResultSchema = z.object({
  mergedContacts: z.array(z.object({
    pairIndex: z.number(),
    merged: MergedContactSchema
  }))
})

export async function POST(request: NextRequest) {
  try {
    const { mergePairs } = await request.json()
    
    if (!Array.isArray(mergePairs)) {
      return NextResponse.json(
        { error: "Invalid merge pairs data" },
        { status: 400 }
      )
    }
    
    const BATCH_SIZE = 50
    const allMergedContacts: Contact[] = []
    
    for (let i = 0; i < mergePairs.length; i += BATCH_SIZE) {
      const batch = mergePairs.slice(i, Math.min(i + BATCH_SIZE, mergePairs.length))
      
      // Prepare the batch for AI processing
      const batchPrompt = batch.map((pair, index) => ({
        pairIndex: i + index,
        existing: pair.existing,
        incoming: pair.incoming
      }))
      
      try {
        const { object } = await generateObject({
          model: anthropic('claude-3-haiku-20240307'),
          schema: BatchMergeResultSchema,
          prompt: `You are merging duplicate contacts. For each pair, intelligently combine the information from both contacts.

CRITICAL MERGING RULES:
- KEEP LinkedIn connection dates (e.g., "LinkedIn connected: January 2024")
- Merge and deduplicate all information
- For ALL fields, NEVER include placeholder values like <UNKNOWN>, N/A, Not Available, null, undefined, TBD, etc.
- Keep the longer/more complete version of names
- Combine all emails, phones, and URLs (remove duplicates)
- Merge notes intelligently, avoiding duplicate information
- Preserve all meaningful information from both contacts

Here are ${batch.length} contact pairs to merge:

${JSON.stringify(batchPrompt, null, 2)}

For each pair, return the merged contact with the pairIndex so we can match them back.`
        })
        
        // Process the AI results
        for (const result of object.mergedContacts) {
          const originalPair = mergePairs[result.pairIndex]
          const mergedContact: Contact = {
            id: originalPair.existing.id, // Keep the existing contact's ID
            ...result.merged,
            source: originalPair.existing.source,
            createdAt: originalPair.existing.createdAt,
            updatedAt: new Date()
          }
          allMergedContacts.push(mergedContact)
        }
      } catch (error) {
        console.error('Failed to process batch:', error)
        // Fallback to individual processing for this batch
        for (const pair of batch) {
          allMergedContacts.push({
            ...pair.existing,
            updatedAt: new Date()
          })
        }
      }
    }
    
    return NextResponse.json({
      mergedContacts: allMergedContacts,
      totalProcessed: mergePairs.length,
      successCount: allMergedContacts.length
    })
  } catch (error) {
    console.error("Error in batch merge:", error)
    return NextResponse.json(
      { error: "Failed to process batch merge" },
      { status: 500 }
    )
  }
}