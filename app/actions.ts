"use server"

import { promises as fs } from "fs"
import path from "path"
import type { Contact } from "@/types/contact"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

export async function saveContacts(contacts: Contact[]) {
  try {
    await ensureDataDirectory()
    await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2))
    return { success: true }
  } catch (error) {
    console.error("Error saving contacts:", error)
    return { success: false, error: "Failed to save contacts" }
  }
}

export async function loadContacts(): Promise<{ contacts: Contact[]; success: boolean; error?: string }> {
  try {
    await ensureDataDirectory()

    try {
      const data = await fs.readFile(dataFilePath, "utf-8")
      const contacts = JSON.parse(data) as Contact[]

      // Convert string dates back to Date objects
      const processedContacts = contacts.map((contact) => ({
        ...contact,
        createdAt: new Date(contact.createdAt),
        updatedAt: new Date(contact.updatedAt),
      }))

      return { contacts: processedContacts, success: true }
    } catch (readError) {
      // If file doesn't exist or is invalid, return empty array
      if ((readError as NodeJS.ErrnoException).code === "ENOENT") {
        return { contacts: [], success: true }
      }
      throw readError
    }
  } catch (error) {
    console.error("Error loading contacts:", error)
    return { contacts: [], success: false, error: "Failed to load contacts" }
  }
}
