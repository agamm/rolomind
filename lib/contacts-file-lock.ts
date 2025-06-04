import { promises as fs } from "fs"
import path from "path"
import type { Contact } from "@/types/contact"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")
const lockFilePath = path.join(process.cwd(), "data", ".contacts.lock")
const MAX_LOCK_WAIT = 5000 // 5 seconds
const LOCK_RETRY_INTERVAL = 50 // 50ms

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Simple file-based locking mechanism
async function acquireLock(): Promise<() => Promise<void>> {
  await ensureDataDirectory()
  
  const startTime = Date.now()
  
  while (Date.now() - startTime < MAX_LOCK_WAIT) {
    try {
      // Try to create lock file exclusively
      const lockFd = await fs.open(lockFilePath, 'wx')
      await lockFd.close()
      
      // Return unlock function
      return async () => {
        try {
          await fs.unlink(lockFilePath)
        } catch {
          // Ignore errors when removing lock
        }
      }
    } catch (error) {
      // Lock file exists, wait and retry
      await new Promise(resolve => setTimeout(resolve, LOCK_RETRY_INTERVAL))
    }
  }
  
  // Force remove stale lock and try once more
  try {
    await fs.unlink(lockFilePath)
  } catch {}
  
  const lockFd = await fs.open(lockFilePath, 'wx')
  await lockFd.close()
  
  return async () => {
    try {
      await fs.unlink(lockFilePath)
    } catch {}
  }
}

export async function readContacts(): Promise<Contact[]> {
  const unlock = await acquireLock()
  
  try {
    await ensureDataDirectory()
    
    try {
      const data = await fs.readFile(dataFilePath, "utf-8")
      
      // Validate JSON before parsing
      if (!data.trim()) {
        return []
      }
      
      const contacts = JSON.parse(data) as Contact[]
      
      if (!Array.isArray(contacts)) {
        console.error("Invalid contacts data: not an array")
        return []
      }
      
      return contacts
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code === "ENOENT") {
        return []
      }
      
      // If JSON is corrupted, backup and return empty
      if (readError instanceof SyntaxError) {
        console.error("Corrupted contacts file, creating backup")
        try {
          const backupPath = path.join(process.cwd(), "data", `contacts.backup.${Date.now()}.json`)
          await fs.copyFile(dataFilePath, backupPath)
        } catch {}
        
        return []
      }
      
      throw readError
    }
  } finally {
    await unlock()
  }
}

export async function writeContacts(contacts: Contact[]): Promise<void> {
  const unlock = await acquireLock()
  
  try {
    await ensureDataDirectory()
    await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2))
  } finally {
    await unlock()
  }
}

export async function deleteContact(contactId: string): Promise<boolean> {
  const unlock = await acquireLock()
  
  try {
    await ensureDataDirectory()
    
    // Read contacts directly without recursive lock
    let contacts: Contact[] = []
    try {
      const data = await fs.readFile(dataFilePath, "utf-8")
      if (data.trim()) {
        contacts = JSON.parse(data)
      }
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code !== "ENOENT") {
        throw readError
      }
    }
    
    const initialLength = contacts.length
    const filteredContacts = contacts.filter(c => c.id !== contactId)
    
    if (filteredContacts.length === initialLength) {
      return false // Contact not found
    }
    
    await fs.writeFile(dataFilePath, JSON.stringify(filteredContacts, null, 2))
    return true
  } finally {
    await unlock()
  }
}

export async function updateContact(updatedContact: Contact): Promise<Contact | null> {
  const unlock = await acquireLock()
  
  try {
    await ensureDataDirectory()
    
    // Read contacts directly without recursive lock
    let contacts: Contact[] = []
    try {
      const data = await fs.readFile(dataFilePath, "utf-8")
      if (data.trim()) {
        contacts = JSON.parse(data)
      }
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code !== "ENOENT") {
        throw readError
      }
    }
    
    const index = contacts.findIndex(c => c.id === updatedContact.id)
    
    if (index === -1) {
      return null
    }
    
    contacts[index] = {
      ...contacts[index],
      ...updatedContact,
      updatedAt: new Date()
    }
    
    await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2))
    return contacts[index]
  } finally {
    await unlock()
  }
}