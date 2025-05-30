import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { z } from 'zod';
import { Contact } from '@/types/contact';
import { createJsonStream } from '@/lib/stream-utils';

export const maxDuration = 30;

const contactMatchSchema = z.object({
  id: z.string().describe('The contact ID that matches the query'),
  reason: z.string().describe('Brief explanation of why this contact matches the query')
});

export async function POST(req: Request) {
  try {
    const { query, contacts } = await req.json();

    if (!query || !contacts || !Array.isArray(contacts)) {
      return new Response('Invalid request body', { status: 400 });
    }

    // Limit contacts to first 500 to avoid AI limits
    const limitedContacts = contacts.slice(0, 500);

    const contactsContext = limitedContacts.map((contact: Contact) => ({
      id: contact.id,
      name: contact.name,
      phones: contact.contactInfo.phones,
      emails: contact.contactInfo.emails,
      linkedinUrls: contact.contactInfo.linkedinUrls,
      notes: contact.notes,
      source: contact.source
    }));

    return createJsonStream(async function* () {
      const { elementStream } = streamObject({
        model: anthropic('claude-3-7-sonnet-20250219'),
        output: 'array',
        schema: contactMatchSchema,
        prompt: `You are helping to search through a contact database. 
        
Given this query: "${query}"

Analyze these contacts and return the ones that best match the query. Consider:
- Name matches (partial or full)
- Company/organization in notes or LinkedIn URLs
- Job titles or roles in notes
- Industry keywords in notes or LinkedIn
- Location information in notes
- Any other relevant context

Here are the contacts to search through:
${JSON.stringify(contactsContext, null, 2)}

Return an array of matches with the contact ID and a brief reason why each contact matches the query. Order by relevance (most relevant first). Only include contacts that are actually relevant to the query.`,
      });

      for await (const match of elementStream) {
        yield match;
      }
    });
  } catch (error) {
    console.error('Error in query-contacts API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}