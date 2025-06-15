import React from 'react'
import { Sparkles, Loader2, TrendingUp } from 'lucide-react'
import { Summary } from '@/hooks/use-summary-generation'

interface SummaryDisplayProps {
  summary: Summary | null
  isGenerating: boolean
  error?: Error | null
}

export function SummaryDisplay({ summary, isGenerating, error }: SummaryDisplayProps) {
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Failed to generate summary: {error.message}</p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-purple-800 dark:text-purple-200">Generating summary...</p>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const highlightNumbers = (text: string) => {
    return text.split(/(\d+%?|\b\d+\b)/g).map((part, index) => {
      if (/^\d+%?$/.test(part)) {
        return <span key={index} className="font-semibold text-primary">{part}</span>
      }
      return part
    })
  }

  return (
    <div className="ai-glow fade-in">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Summary</h3>
          <span className="ml-auto text-muted-foreground">
            {summary.totalMatches} matches found
          </span>
        </div>
        
        <div className="rounded-lg p-4 bg-card/50 dark:bg-card/30 border border-border dark:border-border/50">
          <p className="text-foreground">
            {highlightNumbers(summary.summary)}
          </p>
        </div>
      
      {summary.keyInsights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-foreground">Key Insights</h4>
          </div>
          <div className="space-y-2">
            {summary.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 rounded-lg p-3 bg-card/50 dark:bg-card/30 border border-border dark:border-border/50">
                <span className="text-primary font-bold mt-0.5">•</span>
                <p className="text-foreground flex-1">
                  {highlightNumbers(insight)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}