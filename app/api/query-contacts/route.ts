import { generateObject } from 'ai';
import { z } from 'zod';
import { Contact } from '@/types/contact';
import { handleAIError } from '@/lib/ai-error-handler';
import { openrouter } from '@/lib/openrouter-config';

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

    // Process up to 100 contacts per request
    if (contacts.length > 100) {
      return Response.json({ error: 'Too many contacts' }, { status: 400 });
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

    // Log for debugging
    console.log('Query:', query);
    console.log('Batch size:', batch.length);
    console.log('Sample contact:', batch[0]);

    const { object: matches } = await generateObject({
      model: openrouter('anthropic/claude-sonnet-4'),
      output: 'array',
      schema: matchSchema,
      maxRetries: 4,
      prompt: `Query: "${query}"

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

Contacts to analyze:
${JSON.stringify(batch)}

For each matching contact, return:
{
  "id": "contact-id",
  "reason": "Concise explanation quoting the exact field values that match, e.g., 'Role is CEO and location is Dallas, TX'"
}

ONLY include contacts that match ALL conditions. Return empty array [] if none match.`
    });

    // Log results for debugging
    console.log('Matches found:', matches.length);

    return Response.json({ matches });
  } catch (error) {
    return handleAIError(error);
  }
}