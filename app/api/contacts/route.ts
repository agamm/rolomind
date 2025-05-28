import { promises as fs } from "fs"
import path from "path"
import type { Contact } from "@/types/contact"
import { NextRequest } from "next/server"

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

export async function GET() {
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

      return Response.json({ contacts: processedContacts, success: true })
    } catch (readError) {
      // If file doesn't exist or is invalid, return empty array
      if ((readError as NodeJS.ErrnoException).code === "ENOENT") {
        return Response.json({ contacts: [], success: true })
      }
      throw readError
    }
  } catch (error) {
    console.error("Error loading contacts:", error)
    return Response.json({ contacts: [], success: false, error: "Failed to load contacts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contacts } = await request.json()
    
    if (!Array.isArray(contacts)) {
      return Response.json({ success: false, error: "Invalid contacts data" }, { status: 400 })
    }

    await ensureDataDirectory()
    await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2))
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error saving contacts:", error)
    return Response.json({ success: false, error: "Failed to save contacts" }, { status: 500 })
  }
} 