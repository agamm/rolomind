import type { Contact } from "@/types/contact"
import { NextRequest } from "next/server"
import { readContacts, writeContacts, deleteContact, updateContact } from "@/lib/contacts-file-lock"

export async function GET() {
  try {
    const contacts = await readContacts()

    // Convert string dates back to Date objects
    const processedContacts = contacts.map((contact) => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
      updatedAt: new Date(contact.updatedAt),
    }))

    return Response.json({ contacts: processedContacts, success: true })
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

    await writeContacts(contacts)
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Error saving contacts:", error)
    return Response.json({ success: false, error: "Failed to save contacts" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')
    
    if (!contactId) {
      // If no ID provided, delete all contacts
      await writeContacts([])
      return Response.json({ success: true, message: "All contacts deleted" })
    }
    
    const deleted = await deleteContact(contactId)
    
    if (!deleted) {
      return Response.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      )
    }
    
    return Response.json({ success: true, message: "Contact deleted successfully" })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return Response.json({ success: false, error: "Failed to delete contact" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contact: Contact = await request.json()
    
    if (!contact.id) {
      return Response.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      )
    }

    const updatedContact = await updateContact(contact)
    
    if (!updatedContact) {
      return Response.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      contact: updatedContact
    })
  } catch (error) {
    console.error("Error updating contact:", error)
    return Response.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    )
  }
} 