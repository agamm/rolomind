export interface Contact {
  id: string
  name: string
  company?: string
  role?: string
  location?: string
  contactInfo: {
    phones: string[]
    emails: string[]
    linkedinUrls: string[]
  }
  notes: string
  source: "google" | "linkedin" | "manual"
  createdAt: Date
  updatedAt: Date
}

export interface RawContactData {
  [key: string]: string
}

export interface ImportResult {
  imported: Contact[]
  duplicates: Contact[]
  errors: string[]
}
