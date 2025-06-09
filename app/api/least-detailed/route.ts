import { loadExistingContacts } from '@/lib/contacts-storage';
import { Contact } from '@/types/contact';

export async function GET() {
  try {
    const contacts = await loadExistingContacts();
    
    // Calculate detail score for each contact
    const contactsWithScores = contacts.map((contact: Contact) => {
      let score = 0;
      
      // Basic info scoring
      if (contact.name) score += 2;
      if (contact.company) score += 2;
      if (contact.role) score += 2;
      if (contact.location) score += 2;
      
      // Contact info scoring
      if (contact.contactInfo.emails?.length > 0) score += 2;
      if (contact.contactInfo.phones?.length > 0) score += 2;
      if (contact.contactInfo.linkedinUrl) score += 1;
      if (contact.contactInfo.otherUrls?.length > 0) score += 1;
      
      // Additional info scoring
      if (contact.notes) score += 1;
      
      return { contact, score };
    });
    
    // Sort by score (ascending) to get least detailed first
    contactsWithScores.sort((a, b) => a.score - b.score);
    
    // Return the 50 least detailed contacts
    const leastDetailed = contactsWithScores
      .slice(0, 50)
      .map(({ contact, score }) => ({ ...contact, detailScore: score }));
    
    return Response.json({ contacts: leastDetailed });
  } catch (error) {
    console.error('Error finding least detailed contacts:', error);
    return Response.json({ error: 'Failed to find least detailed contacts' }, { status: 500 });
  }
}