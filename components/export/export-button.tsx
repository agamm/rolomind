"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useExportContacts } from '@/hooks/use-local-contacts'

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const { exportToCSV } = useExportContacts()
  
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      await exportToCSV()
      toast.success('Contacts exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export contacts')
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <Button 
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </>
      )}
    </Button>
  )
}