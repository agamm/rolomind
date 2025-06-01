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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Failed to generate summary: {error.message}</p>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-yellow-800">Generating summary...</p>
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
        return <span key={index} className="font-semibold text-blue-600">{part}</span>
      }
      return part
    })
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border border-purple-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Summary</h3>
        <span className="ml-auto text-sm text-gray-600 font-medium">
          {summary.totalMatches} matches found
        </span>
      </div>
      
      <div className="bg-white/70 rounded-lg p-4">
        <p className="text-gray-800 leading-relaxed font-medium">
          {highlightNumbers(summary.summary)}
        </p>
      </div>
      
      {summary.keyInsights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Key Insights</h4>
          </div>
          <div className="space-y-2">
            {summary.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 bg-white/50 rounded-lg p-3">
                <span className="text-purple-600 font-bold mt-0.5">•</span>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">
                  {highlightNumbers(insight)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}