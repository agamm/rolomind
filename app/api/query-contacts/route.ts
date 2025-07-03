import { generateObject } from 'ai';
import { z } from 'zod';
import { Contact } from '@/types/contact';
import { handleAIError } from '@/lib/ai-error-handler';
import { getServerSession } from '@/lib/auth/server';
import { getAIModel } from '@/lib/ai-client';

export const maxDuration = 30;

const matchSchema = z.object({
  id: z.string(),
  reason: z.string()
});

export async function POST(req: Request) {
  try {
    const { query, contacts } = await req.json();

    if (!query || !contacts || !Array.isArray(contacts)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (contacts.length > 100) {
      return Response.json({ error: 'Too many contacts' }, { status: 400 });
    }

    const session = await getServerSession();
    
    if (!session?.user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }


    const batch = contacts.map((c: Contact) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      role: c.role,
      location: c.location,
      phones: c.contactInfo.phones,
      emails: c.contactInfo.emails,
      linkedinUrl: c.contactInfo.linkedinUrl,
      notes: c.notes,
      source: c.source
    }));

    const promptText = `Query: "${query}"

Instructions:
Find all contacts that match the query.
1. Return an EMPTY array [] if no contacts match ALL conditions
2. ONLY include contacts that satisfy EVERY part of the query

Matching rules:
- "CEOs in XYZ" → role MUST contain "CEO" AND location MUST contain "XYZ"
      - Don't infer, invent or make up any information that isn't explicitly written
      - Don't use "other contacts suggest" or "network indicates" reasoning
      - Every contact is a separate entity, don't combine or merge information from multiple contacts
- Empty/null location = automatic fail for location queries
- Check ONLY explicit field values, never infer
- The only time you can include matches that don't satisfy every part of the query is if the query includes relaxed keywords like "might" or "could".

Contacts to analyze:
${JSON.stringify(batch)}

For each matching contact, return:
{
  "id": "contact-id",
  "reason": "Concise explanation quoting the exact field values that match, e.g., 'Role is CEO and location is Dallas, TX'"
}

ONLY include contacts that match ALL conditions. Return empty array [] if none match.`;

    try {
      const model = await getAIModel('anthropic/claude-3.7-sonnet');
      
      const { object: matches } = await generateObject({
        model: model,
        output: 'array',
        schema: matchSchema,
        maxRetries: 4,
        maxTokens: 1000,
        prompt: promptText
      });

      return Response.json({ matches });
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key not configured')) {
        return Response.json({ 
          error: 'AI service not configured',
          details: error.message,
          action: 'Please configure your API keys in Settings > AI Keys'
        }, { status: 402 });
      }
      throw error;
    }

  } catch (error) {
    return handleAIError(error);
  }
}