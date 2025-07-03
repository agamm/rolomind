import { NextRequest, NextResponse } from "next/server"
import { generateObject, experimental_transcribe } from 'ai'
import { z } from 'zod'
import type { Contact } from '@/types/contact'
import { getServerSession } from '@/lib/auth/server'
import { getAIModel } from '@/lib/ai-client'

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

    // Check audio file size - estimate duration based on file size
    // Typical audio bitrates:
    // - webm/opus: ~32 kbps = ~240 KB per minute
    // - mp3 128kbps: ~960 KB per minute  
    // - wav: ~10 MB per minute
    // Use conservative estimate of 1 MB max for ~1 minute
    const MAX_AUDIO_SIZE = 1 * 1024 * 1024; // 1 MB
    
    if (audioFile.size > MAX_AUDIO_SIZE) {
      const estimatedMinutes = Math.round(audioFile.size / (1024 * 1024));
      return NextResponse.json(
        { 
          success: false, 
          error: `Audio file too long. Please keep recordings under 1 minute. Estimated duration: ${estimatedMinutes} minutes.` 
        },
        { status: 400 }
      )
    }

    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }


    const transcribedText = await transcribeAudio(audioFile)

    const promptText = `Extract contact information updates from this voice transcription about a contact.
      
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
`;

    try {
      const model = await getAIModel('anthropic/claude-3-haiku');
      
      const { object } = await generateObject({
        model: model,
        schema: contactUpdateSchema,
        maxTokens: 200,
        prompt: promptText
      })

      let mergedNotes = currentContact.notes || ''
      
      if (object.notesComplete) {
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
      if (error instanceof Error && error.message.includes('API key not configured')) {
        return NextResponse.json({ 
          success: false,
          error: 'AI service not configured',
          details: error.message,
          action: 'Please configure your API keys in Settings > AI Keys'
        }, { status: 402 })
      }
      throw error;
    }
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
    const { getAIClient } = await import('@/lib/ai-client');
    const aiClient = await getAIClient(true); // Use OpenAI for transcription

    const arrayBuffer = await audioFile.arrayBuffer()
    const audio = new Uint8Array(arrayBuffer)
    
    // Type guard to ensure we have the transcription method
    if (!('transcription' in aiClient)) {
      throw new Error('Transcription not available - OpenAI client not configured properly')
    }
    
    const { text } = await experimental_transcribe({
      model: aiClient.transcription('whisper-1'),
      audio: audio,
    })

    return text
  } catch (error) {
    console.error('Transcription error:', error)
    if (error instanceof Error && error.message.includes('API key not configured')) {
      throw new Error('OpenAI API key not configured. Please add your OpenAI API key in Settings > AI Keys for voice transcription features.')
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to transcribe audio')
  }
}