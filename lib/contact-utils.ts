import type { Contact, RawContactData } from "@/types/contact"

export function normalizeContact(rawData: RawContactData, source: Contact["source"] = "manual"): Contact {
  const id = crypto.randomUUID()
  const now = new Date()

  // LinkedIn specific field mappings
  let name = ""
  if (rawData["First Name"] && rawData["Last Name"]) {
    name = `${rawData["First Name"]} ${rawData["Last Name"]}`.trim()
  } else {
    // Fallback to other name fields
    name =
      rawData.name ||
      rawData.fullName ||
      rawData["full name"] ||
      rawData["Full Name"] ||
      rawData.displayName ||
      rawData["display name"] ||
      rawData["Name"] ||
      "Unknown"
  }

  // Extract contact information with better field mapping
  const phones = extractMultipleValues(rawData, [
    "phone",
    "phoneNumber",
    "mobile",
    "cell",
    "telephone",
    "Phone",
    "Phone Number",
  ])

  const emails = extractMultipleValues(rawData, ["email", "emailAddress", "mail", "Email", "Email Address"])

  const linkedinUrlsArray = extractMultipleValues(rawData, [
    "linkedin",
    "linkedinUrl",
    "linkedinProfile",
    "linkedin_url",
    "URL",
    "Profile URL",
    "LinkedIn URL",
  ])
  const linkedinUrl = linkedinUrlsArray[0]

  // Extract notes from remaining fields with LinkedIn-specific fields
  const notesData: string[] = []

  if (rawData["Company"]) notesData.push(`Company: ${rawData["Company"]}`)
  if (rawData["Position"]) notesData.push(`Position: ${rawData["Position"]}`)
  if (rawData["Location"]) notesData.push(`Location: ${rawData["Location"]}`)
  if (rawData["Connected On"]) notesData.push(`Connected: ${rawData["Connected On"]}`)

  // Add other fields as notes
  Object.entries(rawData).forEach(([key, value]) => {
    if (
      value &&
      !["First Name", "Last Name", "Email Address", "Company", "Position", "Location", "URL", "Connected On"].includes(
        key,
      )
    ) {
      notesData.push(`${key}: ${value}`)
    }
  })

  const notes = notesData.join("; ")

  return {
    id,
    name,
    contactInfo: {
      phones,
      emails,
      linkedinUrl,
      otherUrls: []
    },
    notes,
    source,
    createdAt: now,
    updatedAt: now,
  }
}

function extractMultipleValues(data: RawContactData, fields: string[]): string[] {
  const values: string[] = []

  fields.forEach((field) => {
    const value = data[field] || data[field.toLowerCase()] || data[field.toUpperCase()]
    if (value) {
      // Split by common delimiters and clean up
      const splitValues = value
        .split(/[,;|]/)
        .map((v) => v.trim())
        .filter(Boolean)
      values.push(...splitValues)
    }
  })

  return [...new Set(values)] // Remove duplicates
}

// Basic duplicate detection (you can improve this)
export function findDuplicates(contacts: Contact[]): Contact[][] {
  const duplicateGroups: Contact[][] = []
  const processed = new Set<string>()

  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(contacts[i].id)) continue

    const duplicates: Contact[] = []
    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(contacts[j].id)) continue

      if (areContactsSimilar(contacts[i], contacts[j])) {
        duplicates.push(contacts[j])
        processed.add(contacts[j].id)
      }
    }

    if (duplicates.length > 0) {
      duplicateGroups.push([contacts[i], ...duplicates])
      processed.add(contacts[i].id)
    }
  }

  return duplicateGroups
}

function areContactsSimilar(a: Contact, b: Contact): boolean {
  // Check for email matches
  if (a.contactInfo.emails.some((email) => b.contactInfo.emails.includes(email))) {
    return true
  }

  // Check for phone matches
  if (a.contactInfo.phones.some((phone) => b.contactInfo.phones.includes(phone))) {
    return true
  }

  // Check for name matches (very basic)
  if (a.name.toLowerCase() === b.name.toLowerCase()) {
    return true
  }

  return false
}

// Optimized duplicate detection with early exit and indexing
export function findDuplicatesBetweenSets(newContacts: Contact[], existingContacts: Contact[]): Contact[][] {
  if (existingContacts.length === 0 || newContacts.length === 0) {
    return []
  }

  // Create indexes for faster lookup
  const emailIndex = new Map<string, Contact[]>()
  const phoneIndex = new Map<string, Contact[]>()
  const nameIndex = new Map<string, Contact[]>()

  // Build indexes from existing contacts
  existingContacts.forEach((contact) => {
    // Index by email
    contact.contactInfo.emails.forEach((email) => {
      const key = email.toLowerCase()
      if (!emailIndex.has(key)) emailIndex.set(key, [])
      emailIndex.get(key)!.push(contact)
    })

    // Index by phone (normalized)
    contact.contactInfo.phones.forEach((phone) => {
      const key = phone.replace(/\D/g, "")
      if (key.length > 0) {
        if (!phoneIndex.has(key)) phoneIndex.set(key, [])
        phoneIndex.get(key)!.push(contact)
      }
    })

    // Index by name
    const nameKey = contact.name.toLowerCase()
    if (!nameIndex.has(nameKey)) nameIndex.set(nameKey, [])
    nameIndex.get(nameKey)!.push(contact)
  })

  const duplicateGroups: Contact[][] = []
  const processed = new Set<string>()

  newContacts.forEach((newContact) => {
    if (processed.has(newContact.id)) return

    const duplicates = new Set<Contact>()

    // Check email matches
    newContact.contactInfo.emails.forEach((email) => {
      const matches = emailIndex.get(email.toLowerCase())
      if (matches) {
        matches.forEach((match) => duplicates.add(match))
      }
    })

    // Check phone matches
    newContact.contactInfo.phones.forEach((phone) => {
      const normalizedPhone = phone.replace(/\D/g, "")
      const matches = phoneIndex.get(normalizedPhone)
      if (matches) {
        matches.forEach((match) => duplicates.add(match))
      }
    })

    // Check name matches
    const nameMatches = nameIndex.get(newContact.name.toLowerCase())
    if (nameMatches) {
      nameMatches.forEach((match) => duplicates.add(match))
    }

    if (duplicates.size > 0) {
      const group = [newContact, ...Array.from(duplicates)]
      duplicateGroups.push(group)
      group.forEach((c) => processed.add(c.id))
    }
  })

  return duplicateGroups
}

export function mergeContacts(contacts: Contact[]): Contact {
  if (contacts.length === 0) throw new Error("Cannot merge empty contact list")
  if (contacts.length === 1) return contacts[0]

  const merged = { ...contacts[0] }

  // Use the most recent name (or longest if same date)
  merged.name = contacts.reduce(
    (best, current) => (current.name.length > best.length ? current.name : best),
    merged.name,
  )

  // Merge all contact information
  const linkedinUrls = contacts.map(c => c.contactInfo.linkedinUrl).filter(Boolean) as string[]
  merged.contactInfo = {
    phones: [...new Set(contacts.flatMap((c) => c.contactInfo.phones))],
    emails: [...new Set(contacts.flatMap((c) => c.contactInfo.emails))],
    linkedinUrl: linkedinUrls[0],
    otherUrls: contacts.flatMap((c) => c.contactInfo.otherUrls),
  }

  // Merge notes
  const allNotes = contacts.map((c) => c.notes).filter(Boolean)
  merged.notes = [...new Set(allNotes)].join("; ")

  // Use the earliest creation date and latest update date
  merged.createdAt = new Date(Math.min(...contacts.map((c) => c.createdAt.getTime())))
  merged.updatedAt = new Date()

  return merged
}
