"use client"

import React from "react"
import { toast } from "sonner"
import { TopNav } from "@/components/layout"
import { ContactList } from "./list"
import { useContacts, useImportContacts, useDeleteAllContacts } from "@/hooks/use-contacts-api"

export function ContactManager() {
  const { data: contacts = [], isLoading, error } = useContacts()
  const importMutation = useImportContacts()
  const deleteAllMutation = useDeleteAllContacts()

  const handleFileSelect = async (file: File) => {
    try {
      const result = await importMutation.mutateAsync(file)
      toast.success(`Successfully imported ${result.totalImported} contacts using ${result.parserUsed} parser.`)
    } catch (error) {
      console.error("Failed to import contacts:", error)
      toast.error(`Failed to import contacts: ${error instanceof Error ? error.message : "Please check the file format."}`)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllMutation.mutateAsync()
      toast.success("All contacts deleted successfully")
    } catch (error) {
      console.error("Failed to delete all contacts:", error)
      toast.error(`Failed to delete contacts: ${error instanceof Error ? error.message : "Please try again."}`)
    }
  }

  const handleSearch = () => {
    // Search will be handled in ContactList component
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading contacts</h1>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">
          <TopNav
            contactCount={contacts.length}
            onFileSelect={handleFileSelect}
            onDeleteAll={handleDeleteAll}
            isImporting={importMutation.isPending}
            isDeleting={deleteAllMutation.isPending}
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">Loading contacts...</div>
            </div>
          ) : (
            <ContactList
              contacts={contacts}
              onSearch={handleSearch}
            />
          )}
        </div>
      </div>
    </div>
  )
}