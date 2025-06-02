import { promises as fs } from "fs"
import path from "path"
import type { Contact } from "@/types/contact"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")

export async function loadExistingContacts(): Promise<Contact[]> {
  try {
    const dataDir = path.dirname(dataFilePath)
    await fs.mkdir(dataDir, { recursive: true })
    const data = await fs.readFile(dataFilePath, "utf-8")
    return JSON.parse(data) as Contact[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }
    throw error
  }
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  const dataDir = path.dirname(dataFilePath)
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2))
}