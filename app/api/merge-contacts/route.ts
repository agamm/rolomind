import { NextRequest, NextResponse } from "next/server"
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import type { Contact } from '@/types/contact'

const mergedContactSchema = z.object({
  name: z.string().describe('The most complete and accurate name'),
  company: z.string().optional().describe('Company name - prefer the most recent or complete'),
  role: z.string().optional().describe('Job title/role - prefer the most recent or complete'),
  location: z.string().optional().describe('Location - prefer the most specific'),
  contactInfo: z.object({
    phones: z.array(z.string()).describe('All unique phone numbers from both contacts'),
    emails: z.array(z.string()).describe('All unique email addresses from both contacts'),
    linkedinUrls: z.array(z.string()).describe('All unique LinkedIn URLs from both contacts')
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

    const { object } = await generateObject({
      model: anthropic('claude-3-haiku-20240307'),
      schema: mergedContactSchema,
      prompt: `Merge these two contact records intelligently. 
      
Existing contact:
${JSON.stringify(existing, null, 2)}

Incoming contact:
${JSON.stringify(incoming, null, 2)}

Instructions:
1. Keep the most complete and accurate information from both contacts
2. Combine all contact methods (phones, emails, LinkedIn) without duplicates
3. For structured fields (company, role, location), prefer the most recent or complete information
4. For notes:
   - Combine all unique information from both contacts
   - Remove any information that duplicates the structured fields (company, role, location)
   - KEEP LinkedIn connection dates (e.g., "LinkedIn connected: January 2024") as they provide valuable context
   - Keep any other valuable context, observations, meeting notes, or personal information
   - Format the notes cleanly, one piece of information per line
5. Preserve the best version of the name (longer/more complete is usually better)`
    })

    // Create the merged contact using the existing contact's ID and timestamps
    const mergedContact: Contact = {
      id: existing.id,
      name: object.name,
      company: object.company,
      role: object.role,
      location: object.location,
      contactInfo: object.contactInfo,
      notes: object.notes || '',
      source: existing.source, // Keep original source
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