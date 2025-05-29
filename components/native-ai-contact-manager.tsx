"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import type { Contact } from "@/types/contact"
import { normalizeContact } from "@/lib/contact-utils"
import { parseCSV } from "@/lib/csv-parser"
import { ImportButton } from "@/components/import-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Save, Loader2, AlertCircle, X, Info } from "lucide-react"
import { AISearchInput } from "@/components/ai-search-input"
import { ContactSearchResults } from "@/components/contact-search-results"
import { useContactSearch } from "@/hooks/use-contact-search"
import type { EnhancedSearchInputRef } from "@/components/enhanced-search-input"
import { DebugPane } from "@/components/debug-pane"
import { useDebug } from "@/hooks/use-debug"

// API functions to replace server actions
const loadContacts = async () => {
  try {
    const response = await fetch("/api/contacts")
    const result = await response.json()
    
    if (result.success && result.contacts) {
      // Convert date strings back to Date objects
      result.contacts = result.contacts.map((contact: { createdAt: string | Date; updatedAt: string | Date }) => ({
        ...contact,
        createdAt: new Date(contact.createdAt),
        updatedAt: new Date(contact.updatedAt),
      }))
    }
    
    return result
  } catch (error) {
    console.error("Error loading contacts:", error)
    return { contacts: [], success: false, error: "Failed to load contacts" }
  }
}

const saveContacts = async (contacts: Contact[]) => {
  try {
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts }),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error saving contacts:", error)
    return { success: false, error: "Failed to save contacts" }
  }
}

export function NativeAIContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [importError, setImportError] = useState<string | null>(null)

  // Ref for the search input to clear it
  const searchInputRef = useRef<EnhancedSearchInputRef>(null)

  // Add debug functionality
  const { entries, isVisible, addEntry, clearEntries, toggleVisibility } = useDebug()

  // Use the custom hook for contact search with debug logging
  const {
    searchState,
    isSearching,
    filteredContacts,
    handleAiSearch,
    handleReset,
    handleClearAiSearch,
    getAiReason,
    getFinalSummary,
    hasSummary,
  } = useContactSearch(contacts, addEntry)

  // Load contacts on initial render
  useEffect(() => {
    const fetchContacts = async () => {
      const result = await loadContacts()
      
      if (result.success) {
        setContacts(result.contacts)
      } else {
        console.error("Failed to load contacts:", result.error)
      }
      setIsLoading(false)
    }

    fetchContacts()
  }, [])

  // Manual save function
  const handleSaveContacts = useCallback(async () => {
    setIsSaving(true)
    try {
      await saveContacts(contacts)
    } catch (error) {
      console.error("Error saving contacts:", error)
    } finally {
      setIsSaving(false)
    }
  }, [contacts])

  // Handle file import
  const handleFileImport = useCallback(async (file: File) => {
    setIsImporting(true)
    setImportError(null)

    try {
      const csvContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })

      const rawData = parseCSV(csvContent)
      const source = file.name.toLowerCase().includes("linkedin") ? "linkedin" : "manual"
      const newContacts = rawData.map((data) => normalizeContact(data, source))

      // Update contacts state
      const updatedContacts = [...contacts, ...newContacts]
      setContacts(updatedContacts)
      
      // Save immediately after import
      await saveContacts(updatedContacts)
    } catch (error) {
      console.error("Error parsing CSV:", error)
      setImportError("Error parsing CSV file. Please check the format.")
    } finally {
      setIsImporting(false)
    }
  }, [contacts])

  // Delete contact
  const handleDeleteContact = useCallback(
    async (contactId: string) => {
      const updatedContacts = contacts.filter((c) => c.id !== contactId)
      setContacts(updatedContacts)
      
      // Save immediately after deletion
      await saveContacts(updatedContacts)

      // Also remove from AI search results if active
      if (searchState.isActive) {
        handleReset()
      }
    },
    [contacts, searchState.isActive, handleReset],
  )

  // Handle AI search with input ref
  const handleSearch = useCallback(
    (query: string) => {
      console.log("Starting search with contacts:", contacts.length)
      if (contacts.length === 0) {
        console.error("No contacts loaded for AI search!")
      }
      handleAiSearch(query)
      searchInputRef.current?.clear()
    },
    [handleAiSearch, contacts.length],
  )

  // Debug effect to log when filtered contacts change
  useEffect(() => {
    console.log("Filtered contacts changed:", {
      searchActive: searchState.isActive,
      matchCount: searchState.matches.length,
      filteredCount: filteredContacts.length,
      totalContacts: contacts.length
    })
  }, [searchState.isActive, searchState.matches.length, filteredContacts.length, contacts.length])

  // Handle full reset
  const handleFullReset = useCallback(async () => {
    handleReset()
    searchInputRef.current?.clear()

    // Refresh contacts from storage
    setIsLoading(true)
    const result = await loadContacts()
    if (result.success) {
      setContacts(result.contacts)
    }
    setIsLoading(false)
  }, [handleReset])

  // Download debug data
  const downloadDebugData = useCallback(() => {
    const debugData = {
      timestamp: new Date().toISOString(),
      contacts: contacts.length,
      searchState,
      displayedContacts: filteredContacts.length,
      debugEntries: entries
    }
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rolodex-debug-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [contacts.length, searchState, filteredContacts.length, entries])

  // Stats
  const stats = React.useMemo(() => {
    const total = contacts.length
    const detailed = contacts.filter((c) => {
      const hasContactInfo =
        c.contactInfo.emails.length > 0 || c.contactInfo.phones.length > 0 || c.contactInfo.linkedinUrls.length > 0
      const hasNotes = c.notes && c.notes.length > 20
      return hasContactInfo && hasNotes
    }).length

    const detailedPercentage = total > 0 ? Math.round((detailed / total) * 100) : 0

    return { total, detailed, detailedPercentage }
  }, [contacts])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Import */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Rolodex</h1>
              <p className="text-gray-600">AI-powered contact management</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{stats.total}</span>
                  <span className="text-gray-500">total</span>
                </div>
                <div className="flex items-center gap-1">
                  <Info className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{stats.detailedPercentage}%</span>
                  <span className="text-gray-500">detailed</span>
                </div>
              </div>

              {/* Import Button */}
              <ImportButton onFileSelect={handleFileImport} isImporting={isImporting} />

              {/* Save Button */}
              <Button variant="outline" size="sm" onClick={handleSaveContacts} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Import Error */}
        {importError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{importError}</span>
                <Button variant="ghost" size="sm" onClick={() => setImportError(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Search Input */}
        <AISearchInput
          ref={searchInputRef}
          onSearch={handleSearch}
          onClear={handleClearAiSearch}
          isSearching={isSearching}
          isLoading={isLoading}
        />

        {/* Contact Search Results */}
        <ContactSearchResults
          contacts={contacts}
          aiFilteredContacts={filteredContacts}
          isAiSearch={searchState.isActive}
          isSearching={isSearching}
          query={searchState.query}
          onRegularSearch={() => {}}
          onReset={handleFullReset}
          onDeleteContact={handleDeleteContact}
          getAiReason={getAiReason}
          getFinalSummary={getFinalSummary}
          hasSummary={hasSummary}
        />

        {/* Debug Pane */}
        <DebugPane
          isVisible={isVisible}
          onToggle={toggleVisibility}
          entries={entries}
          onClear={clearEntries}
        />
        
        {/* Debug Download Link */}
        <div className="text-center mt-4 pb-4">
          <button
            onClick={downloadDebugData}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Download Debug Data
          </button>
        </div>
      </div>
    </div>
  )
}
