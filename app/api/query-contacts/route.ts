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

    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: matchSchema,
      prompt: `You are a contact search system that MUST match ALL conditions in compound queries.

QUERY: "${query}"

TASK: Analyze each contact and return ONLY those matching EVERY part of the query.

CRITICAL RULES:
---
1. NEVER invent or assume information not explicitly present in the contact data
2. ONLY use information directly stated in the contact fields
3. If location/company/role is not mentioned, DO NOT assume or guess
4. For compound queries, ALL conditions must be verifiably met
5. If query specifies a specific contact field to focus on, focus on that field when searching.
---

MATCHING RULES:
---
For compound queries like "CEOs in Israel":
✓ MUST have CEO/C-level title explicitly stated (in role, title, or notes)
✓ MUST have Israel explicitly mentioned (in location, company address, or notes)
✗ Do NOT return if location is not specified
✗ Do NOT return if role is not specified
✗ Do NOT guess or infer missing information

For specific contact field queries like "Find contacts with a non-descriptive name":
✓ Name can be like "Contact 123" or "John"
✗ Do NOT return if the company is "Company" (different contact field, isn't the field name)
---

Notes:
---
1. Company "Stealth" is a known way to indicate they are working on a startup in stealth mode.
---

CONTACTS TO ANALYZE:
---
${JSON.stringify(batch)}
---

OUTPUT: Return empty array if no COMPLETE matches with verified information found.
For each match, explain ONLY using facts directly from the contact data.`
    });

    return Response.json(object);
  } catch (error) {
    return handleAIError(error);
  }
}