import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Contact } from '@/types/contact';
import { handleAIError } from '@/lib/ai-error-handler';

export const maxDuration = 30;

const matchSchema = z.object({
  matches: z.array(z.object({
    id: z.string(),
    reason: z.string()
  }))
});

export async function POST(req: Request) {
  try {
    const { query, contacts } = await req.json();

    if (!query || !contacts || !Array.isArray(contacts)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Process up to 100 contacts per request
    const batch = contacts.slice(0, 100).map((c: Contact) => ({
      id: c.id,
      name: c.name,
      phones: c.contactInfo.phones,
      emails: c.contactInfo.emails,
      linkedinUrls: c.contactInfo.linkedinUrls,
      notes: c.notes,
      source: c.source
    }));

    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: matchSchema,
      prompt: `You are a contact search system that MUST match ALL conditions in compound queries.

QUERY: "${query}"

TASK: Analyze each contact and return ONLY those matching EVERY part of the query.

MATCHING RULES:
---
For compound queries like "CEOs in Israel":
✓ MUST be CEO/C-level executive (check: title, role, position)
✓ MUST be in Israel (check: location, country, city, company HQ)
✗ Do NOT return CEOs not in Israel
✗ Do NOT return non-CEOs in Israel
✗ Do NOT return contacts you aren't sure about
---

CONTACTS TO ANALYZE:
---
${JSON.stringify(batch)}
---

OUTPUT: Return empty array if no COMPLETE matches found.`
    });

    return Response.json(object);
  } catch (error) {
    return handleAIError(error);
  }
}