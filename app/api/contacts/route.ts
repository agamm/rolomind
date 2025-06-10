import type { Contact } from "@/types/contact"
import { NextRequest } from "next/server"
import { getAllContacts, createContactsBatch, deleteContact, deleteAllContacts, updateContact } from "@/db"

export async function GET() {
  try {
    const contacts = await getAllContacts()

    return Response.json({ contacts, success: true })
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

    // Save all contacts in a single batch
    await createContactsBatch(contacts)
    
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
      await deleteAllContacts()
      return Response.json({ success: true, message: "All contacts deleted" })
    }
    
    await deleteContact(contactId)
    
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

    await updateContact(contact)

    return Response.json({
      success: true,
      contact
    })
  } catch (error) {
    console.error("Error updating contact:", error)
    return Response.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    )
  }
}