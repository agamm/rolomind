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

    const { object: matches } = await generateObject({
      model: openrouter('anthropic/claude-3.7-sonnet'),
      output: 'array',
      schema: matchSchema,
      maxRetries: 4,
      prompt: `Find contacts matching the user's search query.

QUERY: "${query}"
TODAY: ${new Date().toISOString()}

MATCHING MODES:
• RELAXED mode if query contains: "might", "could", "possibly", "potential", "maybe", "perhaps", "probably"
• STRICT mode (default) for all other queries

STRICT: Only match explicit evidence (e.g., "connection to John" requires John mentioned in notes)
RELAXED: Allow reasonable inferences (e.g., "might know Elon" matches senior Tesla employees)

TEMPORAL QUERIES:
LinkedIn dates format: "LinkedIn connected: DD-Mon-YY" where YY = 20YY (25=2025, 24=2024)
• "before 2024" = 2023 or earlier
• "after 2024" = 2025 or later
• "in 2024" = only during 2024

KEY EXAMPLES:
1. "non descriptive contact names" → Match placeholders like "tmp", "Contact 123", NOT real names like "John Smith"
2. "CEOs in Dallas" → BOTH role=CEO AND location contains Dallas
3. "connected before 2024" → LinkedIn date in 2023 or earlier (NOT "9-May-25" which is 2025!)
4. "developers before 2024 from linkedin" → developer role AND LinkedIn date before 2024

RULES:
• Match ALL conditions in compound queries
• Empty fields cannot satisfy conditions
• Never assume connections/relationships without explicit evidence
• "Stealth" company = stealth startup
• For each match, explain which fields matched and why

CONTACTS:
${JSON.stringify(batch)}

Output format:
"""
${JSON.stringify(matchSchema)}
"""
Where id is the contact id and reason is a clear explanation of why the contact matches the query.

Return only matching contacts with clear explanations.`
    });

    return Response.json({ matches });
  } catch (error) {
    return handleAIError(error);
  }
}