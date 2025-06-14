import { NextRequest, NextResponse } from "next/server"
import { generateObject, experimental_transcribe } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { Contact } from '@/types/contact'
import { openrouter } from '@/lib/openrouter-config'

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
  notesComplete: z.string().optional().describe('Complete notes field after merging new information - include both existing notes and any new information mentioned'),
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
      model: openrouter('anthropic/claude-3-haiku'),
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
4. For notes:
   - If any note content is mentioned, provide the COMPLETE notes field in notesComplete
   - Merge existing notes with new information mentioned in the transcription
   - Preserve all existing notes and add new information
   - Avoid duplicating information that already exists
5. If the speaker explicitly says to remove or clear something, include it in fieldsToRemove
6. Be conservative - only extract clear, explicit information

Examples of what to extract:
- "Their new email is john@example.com" → emails: ["john@example.com"]
- "They moved to San Francisco" → location: "San Francisco"
- "They're now the CTO" → role: "CTO"
- "Remove their phone number" → fieldsToRemove: ["phones"]
- "They mentioned they love hiking" → notesComplete: "[existing notes]\n\nLoves hiking"
`
    })

    // Merge the extracted information with the current contact
    let mergedNotes = currentContact.notes || ''
    
    // Handle notes updates
    if (object.notesComplete) {
      // AI provided complete updated notes
      mergedNotes = object.notesComplete
    }
    
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
      notes: mergedNotes,
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
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Voice transcription requires OPENAI_API_KEY.')
    }

    // Use the AI SDK's experimental transcribe function with OpenAI's Whisper
    const arrayBuffer = await audioFile.arrayBuffer()
    const audio = new Uint8Array(arrayBuffer)
    
    const { text } = await experimental_transcribe({
      model: openai.transcription('whisper-1'),
      audio: audio,
    })

    return text
  } catch (error) {
    console.error('Transcription error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to transcribe audio')
  }
}