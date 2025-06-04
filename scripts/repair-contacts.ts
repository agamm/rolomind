#!/usr/bin/env node
import { promises as fs } from "fs"
import path from "path"

const dataFilePath = path.join(process.cwd(), "data", "contacts.json")
const backupDir = path.join(process.cwd(), "data", "backups")

async function repairContacts() {
  console.log("🔧 Checking contacts file...")
  
  try {
    // Try to read the file
    const data = await fs.readFile(dataFilePath, "utf-8")
    
    // Try to parse it
    try {
      const contacts = JSON.parse(data)
      
      if (Array.isArray(contacts)) {
        console.log(`✅ Contacts file is valid with ${contacts.length} contacts`)
        return
      } else {
        console.log("❌ Contacts file contains non-array data")
      }
    } catch (parseError) {
      console.log("❌ Contacts file contains invalid JSON:", parseError.message)
      
      // Create backup
      await fs.mkdir(backupDir, { recursive: true })
      const backupPath = path.join(backupDir, `contacts.corrupted.${Date.now()}.json`)
      await fs.copyFile(dataFilePath, backupPath)
      console.log(`📦 Backed up corrupted file to: ${backupPath}`)
      
      // Try to extract valid JSON objects
      const lines = data.split('\n')
      const validContacts = []
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const obj = JSON.parse(line)
            if (obj.id && obj.name) {
              validContacts.push(obj)
            }
          } catch {}
        }
      }
      
      if (validContacts.length > 0) {
        console.log(`🔍 Recovered ${validContacts.length} contacts from corrupted file`)
        await fs.writeFile(dataFilePath, JSON.stringify(validContacts, null, 2))
        console.log("✅ Contacts file repaired!")
      } else {
        console.log("❌ Could not recover any contacts")
        await fs.writeFile(dataFilePath, JSON.stringify([], null, 2))
        console.log("✅ Created empty contacts file")
      }
    }
  } catch (readError) {
    if (readError.code === "ENOENT") {
      console.log("❌ No contacts file found")
      await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
      await fs.writeFile(dataFilePath, JSON.stringify([], null, 2))
      console.log("✅ Created new empty contacts file")
    } else {
      console.error("❌ Error reading contacts file:", readError)
    }
  }
}

// Run if called directly
if (require.main === module) {
  repairContacts().catch(console.error)
}

export { repairContacts }