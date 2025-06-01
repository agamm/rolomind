import React, { useEffect, useState } from 'react'
import { Loader2, FileText, Sparkles, CheckCircle } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface ImportProgressModalProps {
  isOpen: boolean
  status: 'detecting' | 'processing' | 'normalizing' | 'checking-duplicates' | 'saving' | 'complete' | 'error'
  parserType?: 'linkedin' | 'llm-normalizer'
  progress?: {
    current: number
    total: number
    message?: string
  }
  error?: string
  onCancel?: () => void
}

export function ImportProgressModal({ 
  isOpen, 
  status, 
  parserType,
  progress,
  error,
  onCancel
}: ImportProgressModalProps) {
  const [showFormatSelected, setShowFormatSelected] = useState(false)
  const [prevStatus, setPrevStatus] = useState(status)
  
  // Show format selection when we have a parser type during detection
  useEffect(() => {
    if (status === 'detecting' && parserType && !showFormatSelected) {
      setShowFormatSelected(true)
    } else if (status !== 'detecting' && showFormatSelected) {
      // Keep showing during transition
      setTimeout(() => setShowFormatSelected(false), 300)
    }
    setPrevStatus(status)
  }, [status, parserType, prevStatus, showFormatSelected])
  
  const getStatusContent = () => {
    switch (status) {
      case 'detecting':
        return {
          icon: showFormatSelected 
            ? <CheckCircle className="h-8 w-8 text-green-500 animate-in zoom-in duration-300" />
            : <FileText className="h-8 w-8 text-gray-500 animate-pulse" />,
          title: showFormatSelected ? 'Format Detected!' : 'Analyzing CSV Format',
          description: showFormatSelected 
            ? `Using ${parserType === 'linkedin' ? 'LinkedIn' : 'AI'} parser`
            : 'Detecting CSV structure...'
        }
      
      case 'processing':
      case 'normalizing':
        const isLLM = parserType === 'llm-normalizer'
        return {
          icon: isLLM ? (
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          ) : (
            <FileText className="h-8 w-8 text-blue-500 animate-pulse" />
          ),
          title: isLLM ? 'AI-Powered Normalization' : 'Processing LinkedIn CSV',
          description: isLLM 
            ? 'Using AI to understand and normalize your contact data...'
            : 'Parsing LinkedIn export format...'
        }
      
      case 'checking-duplicates':
        return {
          icon: <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />,
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
          icon: <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />,
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
  
  const canCancel = status !== 'complete' && status !== 'error'
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && canCancel && onCancel) {
        onCancel()
      }
    }}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={!canCancel}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {content.icon}
            <DialogTitle className="text-center">{content.title}</DialogTitle>
            <DialogDescription className="text-center">
              {content.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        {showProgress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{progress.message || 'Processing...'}</span>
              <span className="font-medium">
                {progressPercent}% ({progress.current} / {progress.total})
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
        
        {(status === 'detecting' || showFormatSelected) && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-3">
              <div className={`relative px-4 py-2 rounded-lg transition-all duration-500 ${
                showFormatSelected && parserType === 'linkedin' 
                  ? 'bg-blue-100 border-2 border-blue-500 scale-105' 
                  : showFormatSelected && parserType !== 'linkedin'
                  ? 'opacity-40 grayscale'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <FileText className={`h-4 w-4 transition-colors duration-300 ${
                    showFormatSelected && parserType === 'linkedin' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    showFormatSelected && parserType === 'linkedin' ? 'text-blue-700' : 'text-gray-600'
                  }`}>LinkedIn</span>
                </div>
              </div>
              
              <div className={`relative px-4 py-2 rounded-lg transition-all duration-500 ${
                showFormatSelected && parserType === 'llm-normalizer' 
                  ? 'bg-purple-100 border-2 border-purple-500 scale-105' 
                  : showFormatSelected && parserType !== 'llm-normalizer'
                  ? 'opacity-40 grayscale'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 transition-colors duration-300 ${
                    showFormatSelected && parserType === 'llm-normalizer' ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    showFormatSelected && parserType === 'llm-normalizer' ? 'text-purple-700' : 'text-gray-600'
                  }`}>Custom</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {parserType && ['processing', 'normalizing', 'saving'].includes(status) && (
          <div className="mt-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs">
              {parserType === 'linkedin' ? (
                <>
                  <FileText className="h-3 w-3 text-blue-500" />
                  LinkedIn Format
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  Custom Format (AI)
                </>
              )}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}