"use client"

import React from "react"
import type { Contact } from "@/types/contact"
import { ImportButton } from "@/components/import-button"
import { ContactSearchResults } from "@/components/contact-search-results"
import { useContacts, useImportContacts } from "@/hooks/use-contacts-api"

export function ContactManager() {
  const { data: contacts = [], isLoading, error } = useContacts()
  const importMutation = useImportContacts()

  const handleFileSelect = async (file: File) => {
    try {
      const result = await importMutation.mutateAsync(file)
      alert(`Successfully imported ${result.totalImported} contacts using ${result.parserUsed} parser.`)
    } catch (error) {
      console.error("Failed to import contacts:", error)
      alert(`Failed to import contacts: ${error instanceof Error ? error.message : "Please check the file format."}`)
    }
  }

  const handleSearch = () => {
    // Search will be handled in ContactSearchResults component
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Rolodex</h1>
            <ImportButton
              onFileSelect={handleFileSelect}
              isImporting={importMutation.isPending}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">Loading contacts...</div>
            </div>
          ) : (
            <ContactSearchResults
              contacts={contacts}
              onSearch={handleSearch}
            />
          )}
        </div>
      </div>
    </div>
  )
}