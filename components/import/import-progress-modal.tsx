import React, { useEffect, useState } from 'react'
import { Loader2, FileText, Sparkles, CheckCircle, LucideIcon } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ImportProgressModalProps {
  isOpen: boolean
  status: 'detecting' | 'processing' | 'normalizing' | 'checking-duplicates' | 'saving' | 'complete' | 'error'
  parserType?: 'linkedin' | 'rolodex' | 'google' | 'custom' | 'llm-normalizer'
  progress?: {
    current: number
    total: number
    message?: string
  }
  error?: string
  onClose: () => void
}

export function ImportProgressModal({ 
  isOpen, 
  status, 
  parserType,
  progress,
  error,
  onClose
}: ImportProgressModalProps) {
  const [showFormatSelected, setShowFormatSelected] = useState(false)
  const [prevStatus, setPrevStatus] = useState(status)
  
  // Show format selection when we have a parser type during detection
  useEffect(() => {
    if (status === 'detecting' && parserType && !showFormatSelected) {
      setShowFormatSelected(true)
    } else if (status !== 'detecting') {
      setShowFormatSelected(false)
    }
    setPrevStatus(status)
  }, [status, parserType, prevStatus, showFormatSelected])
  
  const getStatusContent = () => {
    switch (status) {
      case 'detecting':
        return {
          icon: showFormatSelected 
            ? <CheckCircle className="h-8 w-8 text-green-500 animate-in zoom-in duration-300" />
            : <FileText className="h-8 w-8 text-muted-foreground animate-pulse" />,
          title: showFormatSelected ? 'Format Detected!' : 'Analyzing CSV Format',
          description: showFormatSelected 
            ? `Using ${parserType === 'linkedin' ? 'LinkedIn' : parserType === 'rolodex' ? 'Rolomind' : parserType === 'google' ? 'Google' : 'Custom (AI)'} parser`
            : 'Detecting CSV structure...'
        }
      
      case 'processing':
      case 'normalizing':
        const isCustom = parserType === 'custom' || parserType === 'llm-normalizer'
        const isRolodex = parserType === 'rolodex'
        const isGoogle = parserType === 'google'
        return {
          icon: isCustom ? (
            <div className="relative h-16 w-16 flex items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary border-r-primary" />
              <Sparkles className="h-8 w-8 text-primary animate-pulse relative z-10" />
            </div>
          ) : (
            <FileText className="h-8 w-8 text-primary animate-pulse" />
          ),
          title: isCustom ? 'AI-Powered Normalization' : 
                 isRolodex ? 'Processing Rolomind Export' : 
                 isGoogle ? 'Processing Google Contacts' :
                 'Processing LinkedIn CSV',
          description: isCustom 
            ? 'Using AI to understand and normalize your contact data...'
            : isRolodex 
            ? 'Importing your Rolomind contacts...'
            : isGoogle
            ? 'Importing your Google contacts...'
            : 'Parsing LinkedIn export format...'
        }
      
      case 'checking-duplicates':
        return {
          icon: <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />,
          title: 'Checking for Duplicates',
          description: 'Searching for existing contacts with matching information...'
        }
      
      case 'saving':
        return {
          icon: <Loader2 className="h-8 w-8 text-green-500 animate-spin" />,
          title: 'Saving Contacts',
          description: 'Saving normalized contacts to your database...'
        }
      
      case 'complete':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Import Complete!',
          description: progress ? `Successfully imported ${progress.current} contacts.` : 'Import completed successfully.'
        }
      
      case 'error':
        return {
          icon: <FileText className="h-8 w-8 text-red-500" />,
          title: 'Import Failed',
          description: error || 'An error occurred during import.'
        }
      
      default:
        return {
          icon: <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />,
          title: 'Processing',
          description: 'Working on your import...'
        }
    }
  }
  
  const content = getStatusContent()
  const showProgress = progress && ['processing', 'normalizing', 'checking-duplicates', 'saving'].includes(status)
  const progressPercent = showProgress && progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Progress</DialogTitle>
          <DialogDescription className="sr-only">
            Import progress dialog
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {content.icon}
          <h2 className="text-lg font-semibold text-center">{content.title}</h2>
          {status === 'error' && error && error.includes('mailto:') ? (
            <p 
              className="text-sm text-muted-foreground text-center"
              dangerouslySetInnerHTML={{ __html: content.description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {content.description}
            </p>
          )}
          {status === 'error' && error && (error.toLowerCase().includes('insufficient credits') || error.toLowerCase().includes('rate limit')) && (
            <Link href="/dashboard/billing" className="mt-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={(e) => {
                  // Ensure modal closes when clicking the button
                  e.stopPropagation()
                  onClose()
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Buy More AI Usage
              </Button>
            </Link>
          )}
        </div>
      
      {showProgress && (
        <div className="space-y-3 px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{progress.message || 'Processing...'}</span>
            <span className="font-medium">
              {progressPercent}% ({progress.current} / {progress.total})
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {(parserType === 'custom' || parserType === 'llm-normalizer') && status === 'normalizing' && progressPercent > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-purple-600 dark:text-purple-400">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI is extracting names, emails, phones, and other contact details...</span>
            </div>
          )}
        </div>
      )}
      
      {status === 'detecting' && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap px-6 pb-4">
          <FormatOption
            icon={FileText}
            label="Rolomind"
            isSelected={showFormatSelected && parserType === 'rolodex'}
            showFormatSelected={showFormatSelected}
            baseColor="green"
          />
          <FormatOption
            icon={FileText}
            label="LinkedIn"
            isSelected={showFormatSelected && parserType === 'linkedin'}
            showFormatSelected={showFormatSelected}
            baseColor="blue"
          />
          <FormatOption
            icon={FileText}
            label="Google"
            isSelected={showFormatSelected && parserType === 'google'}
            showFormatSelected={showFormatSelected}
            baseColor="red"
          />
          <FormatOption
            icon={Sparkles}
            label="Custom"
            isSelected={showFormatSelected && (parserType === 'custom' || parserType === 'llm-normalizer')}
            showFormatSelected={showFormatSelected}
            baseColor="purple"
          />
        </div>
      )}
      
      {parserType && ['processing', 'normalizing', 'saving'].includes(status) && (
        <div className="mt-4 flex flex-col items-center gap-2 px-6 pb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted border border-border px-3 py-1 text-xs">
            {parserType === 'rolodex' ? (
              <>
                <FileText className="h-3 w-3 text-green-500" />
                Rolomind Format
              </>
            ) : parserType === 'linkedin' ? (
              <>
                <FileText className="h-3 w-3 text-blue-500" />
                LinkedIn Format
              </>
            ) : parserType === 'google' ? (
              <>
                <FileText className="h-3 w-3 text-red-500" />
                Google Format
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-purple-500" />
                Custom Format (AI)
              </>
            )}
          </span>
          {(parserType === 'custom' || parserType === 'llm-normalizer') && status === 'normalizing' && (
            <div className="text-xs text-muted-foreground animate-pulse">
              AI is analyzing field patterns and data structure...
            </div>
          )}
        </div>
      )}
      </DialogContent>
    </Dialog>
  )
}

// Simplified format option component
function FormatOption({ 
  icon: Icon, 
  label, 
  isSelected, 
  showFormatSelected,
  baseColor 
}: { 
  icon: LucideIcon
  label: string
  isSelected: boolean
  showFormatSelected: boolean
  baseColor: 'blue' | 'purple' | 'green' | 'red'
}) {
  const bgClasses = {
    blue: isSelected ? 'bg-blue-100 dark:bg-blue-950/30 border-2 border-blue-500 dark:border-blue-400 scale-105' : 'bg-muted border border-border',
    purple: isSelected ? 'bg-purple-100 dark:bg-purple-950/30 border-2 border-purple-500 dark:border-purple-400 scale-105' : 'bg-muted border border-border',
    green: isSelected ? 'bg-green-100 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-400 scale-105' : 'bg-muted border border-border',
    red: isSelected ? 'bg-red-100 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-400 scale-105' : 'bg-muted border border-border'
  }
  
  const iconClasses = {
    blue: isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
    purple: isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground',
    green: isSelected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
    red: isSelected ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
  }
  
  const textClasses = {
    blue: isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground',
    purple: isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground',
    green: isSelected ? 'text-green-700 dark:text-green-300' : 'text-muted-foreground',
    red: isSelected ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'
  }
  
  return (
    <div className={`relative px-4 py-2 rounded-lg transition-all duration-500 ${
      bgClasses[baseColor]
    } ${showFormatSelected && !isSelected ? 'opacity-40 grayscale' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 transition-colors duration-300 ${iconClasses[baseColor]}`} />
        <span className={`text-sm font-medium transition-colors duration-300 ${textClasses[baseColor]}`}>
          {label}
        </span>
      </div>
    </div>
  )
}