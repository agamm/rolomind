"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface UsageData {
  totalCostCents: number
  usageCapCents: number
}

export function UsageBadge() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch(`/api/usage?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setUsage(data)
        }
      } catch (error) {
        console.error("Error fetching usage data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <span className="text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin inline" />
      </span>
    )
  }

  if (!usage) {
    return null
  }

  const usagePercentage = (usage.totalCostCents / usage.usageCapCents) * 100
  const isNearLimit = usagePercentage > 80

  return (
    <span 
      className={`text-xs font-mono ${isNearLimit ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {formatCents(usage.totalCostCents)}
    </span>
  )
}