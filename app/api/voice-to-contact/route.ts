import { NextRequest, NextResponse } from "next/server"
import { generateObject, experimental_transcribe } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { Contact } from '@/types/contact'

const contactUpdateSchema = z.object({
  name: z.string().optional().describe('Updated name if mentioned'),
  company: z.string().optional().describe('Company name if mentioned'),
  role: z.string().optional().describe('Job title/role if mentioned'),
  location: z.string().optional().describe('Location if mentioned'),
  emails: z.array(z.string()).optional().describe('New email addresses mentioned'),
  phones: z.array(z.string()).optional().describe('New phone numbers mentioned'),
  linkedinUrl: z.string().optional().describe('LinkedIn URL if mentioned'),
  otherUrls: z.array(z.object({
    platform: z.string(),
    url: z.string()
  })).optional().describe('Other social media or website URLs mentioned (e.g., Twitter, personal website)'),
  notesToAdd: z.string().optional().describe('Additional notes to append to existing notes'),
  fieldsToRemove: z.array(z.string()).optional().describe('Fields to clear/remove if explicitly mentioned')
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const currentContact = JSON.parse(formData.get('contact') as string) as Contact
    
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Transcribe audio using OpenAI Whisper
    const transcribedText = await transcribeAudio(audioFile)

    // Use AI to extract structured information from the transcription
    const { object } = await generateObject({
      model: anthropic('claude-3-haiku-20240307'),
      schema: contactUpdateSchema,
      prompt: `Extract contact information updates from this voice transcription about a contact.
      
Current contact information:
${JSON.stringify(currentContact, null, 2)}

Voice transcription:
"${transcribedText}"

Instructions:
1. Extract any new or updated information mentioned in the transcription
2. Only include fields that are explicitly mentioned or updated
3. For emails, phones, and LinkedIn URLs, only include NEW ones not already in the contact
4. For notes, provide additional information to be appended to existing notes
5. If the speaker explicitly says to remove or clear something, include it in fieldsToRemove
6. Be conservative - only extract clear, explicit information

Examples of what to extract:
- "Their new email is john@example.com" → emails: ["john@example.com"]
- "They moved to San Francisco" → location: "San Francisco"
- "They're now the CTO" → role: "CTO"
- "Remove their phone number" → fieldsToRemove: ["phones"]
- "They mentioned they love hiking" → notesToAdd: "Loves hiking"
`
    })

    // Merge the extracted information with the current contact
    const updatedContact: Contact = {
      ...currentContact,
      name: object.name || currentContact.name,
      company: object.company || currentContact.company,
      role: object.role || currentContact.role,
      location: object.location || currentContact.location,
      contactInfo: {
        emails: [...new Set([...currentContact.contactInfo.emails, ...(object.emails || [])])],
        phones: [...new Set([...currentContact.contactInfo.phones, ...(object.phones || [])])],
        linkedinUrl: object.linkedinUrl || currentContact.contactInfo.linkedinUrl,
        otherUrls: [
          ...(currentContact.contactInfo.otherUrls || []),
          ...(object.otherUrls || [])
        ]
      },
      notes: currentContact.notes + (object.notesToAdd ? `\n\n${object.notesToAdd}` : ''),
      updatedAt: new Date()
    }

    // Handle field removals if any
    if (object.fieldsToRemove) {
      object.fieldsToRemove.forEach(field => {
        switch (field) {
          case 'company':
            updatedContact.company = undefined
            break
          case 'role':
            updatedContact.role = undefined
            break
          case 'location':
            updatedContact.location = undefined
            break
          case 'emails':
            updatedContact.contactInfo.emails = []
            break
          case 'phones':
            updatedContact.contactInfo.phones = []
            break
          case 'linkedinUrl':
            updatedContact.contactInfo.linkedinUrl = undefined
            break
          case 'otherUrls':
            updatedContact.contactInfo.otherUrls = []
            break
        }
      })
    }

    return NextResponse.json({
      success: true,
      updatedContact,
      changes: object,
      transcription: transcribedText
    })
  } catch (error) {
    console.error("Error processing voice recording:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process voice recording"
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    // Convert File to Uint8Array for the transcription API
    const arrayBuffer = await audioFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const result = await experimental_transcribe({
      model: openai.transcription('whisper-1'),
      audio: uint8Array,
    })
    
    return result.text
  } catch (error) {
    console.error('Transcription error:', error)
    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('API key')) {
      return "OpenAI API key not configured. Set OPENAI_API_KEY environment variable to enable voice transcription."
    }
    throw new Error('Failed to transcribe audio')
  }
}