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
      model: anthropic('claude-3-7-sonnet-20250219'),
      schema: matchSchema,
      prompt: `You are an advanced contact search system. Your task is to find contacts that match the user's search query.

USER QUERY: "${query}"

STEP 1: UNDERSTAND THE QUERY
First, analyze what the user is looking for:
- Which specific fields are mentioned? (name, company, role, location, etc.)
- Is this a compound query requiring multiple conditions?
- Are they looking for specific patterns or characteristics?

STEP 2: FIELD MAPPING
Contact fields available:
- name: Person's full name
- company: Company/organization name
- role: Job title/position
- location: Geographic location
- emails: Email addresses
- phones: Phone numbers
- linkedinUrl: LinkedIn profile URL
- notes: Additional information
- source: Where the contact came from

STEP 3: APPLY SEARCH LOGIC

EXAMPLES OF CORRECT MATCHING:
---
Query: "Find non descriptive contact names (like 'tmp' or 'Contact 123')"
→ Focus on the NAME field only
→ Non-descriptive names are placeholder/temporary names, NOT real people names

WHAT ARE NON-DESCRIPTIVE NAMES:
- "tmp 1", "contact 123", "John"

WHAT ARE DESCRIPTIVE NAMES (DO NOT MATCH):
- Real full names: "John Smith", "Ariel Ofer", "Jane Doe"
- Any name that sounds like a real person

✓ Match: {name: "Contact 123", company: "Google"} - name is a placeholder
✓ Match: {name: "tmp", company: "Meta"} - name is temporary text
✓ Match: {name: "test user", company: "Apple"} - name is test data
✗ Don't match: {name: "Ariel Ofer", company: ""} - this is a real person's name
✗ Don't match: {name: "John A.", company: ""} - this is a real first name
✗ Don't match: {name: "Sarah Johnson", company: "tmp"} - name is real (ignore company field)
---

---
Query: "CEOs in Israel"
→ Focus on ROLE and LOCATION fields
✓ Match: {role: "CEO", location: "Tel Aviv, Israel"} - has CEO role AND Israel location
✓ Match: {role: "Chief Executive Officer", location: "Israel"} - has CEO role AND Israel location
✗ Don't match: {role: "CEO", location: ""} - missing location
✗ Don't match: {role: "CTO", location: "Israel"} - wrong role
✗ Don't match: {role: "CEO", location: "USA"} - wrong location
---

---
Query: "software engineers at startups"
→ Focus on ROLE and COMPANY fields
✓ Match: {role: "Software Engineer", company: "TechStartup (Seed)"} - has engineer role AND startup indicator
✓ Match: {role: "Senior Engineer", notes: "Working at early stage startup"} - has engineer role AND startup mentioned
✗ Don't match: {role: "Software Engineer", company: "Google"} - not a startup
✗ Don't match: {role: "Product Manager", company: "Startup Inc"} - wrong role
---

CRITICAL RULES:
1. ONLY examine the fields relevant to the query
2. NEVER match based on unrelated fields, unless a field isn't specified
3. For compound queries, ALL conditions must be met
4. Empty or missing fields cannot satisfy a condition

SPECIAL CONVENTIONS:
- "Stealth" as a company name indicates stealth mode startup
- LinkedIn connections format: "LinkedIn connected: 9-May-25"
- Common non-descriptive names: "tmp", "test", "Contact [number]", "User [number]", single common first names without last names

CONTACTS TO ANALYZE:
${JSON.stringify(batch, null, 2)}

Return ONLY contacts that match the query criteria. For each match, explain which specific fields matched and why.`
    });

    return Response.json(object);
  } catch (error) {
    return handleAIError(error);
  }
}