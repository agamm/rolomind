"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface UsageData {
  totalCostCents: number;
  usageCapCents: number;
  inputTokens?: number;
  outputTokens?: number;
  usageEvents: Array<{
    meterName: string;
    consumedUnits: number;
    amount: number;
    meterId: string;
  }>;
}

import { PRICING_WITH_PROFIT, formatPricingWithBase, BASE_PRICING } from "@/lib/config";

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimatesOpen, setEstimatesOpen] = useState(false);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        // Fetch usage data from our API endpoint with cache busting
        const response = await fetch(`/api/usage?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
          console.log("Fetched usage data:", data);
        } else {
          console.error("Failed to fetch usage data:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  const usagePercentage = usage ? ((usage.totalCostCents / usage.usageCapCents) * 100) : 0;
  const isNearLimit = usage && usagePercentage > 80;

  const formatTokenCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(2)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get token totals directly from usage data
  const tokenTotals = {
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : usage ? (
          <>
            {/* Main Usage Display */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {formatCents(usage.totalCostCents)}
                  </p>
                  <p className="text-sm text-muted-foreground">Used this month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {formatCents(usage.usageCapCents - usage.totalCostCents)} remaining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {formatCents(usage.usageCapCents)} limit
                  </p>
                </div>
              </div>
              
              <Progress 
                value={usagePercentage} 
                className="h-3"
                style={{
                  // @ts-expect-error - CSS variable
                  '--progress-background': isNearLimit ? 'hsl(var(--destructive))' : undefined
                }}
              />
              
              {isNearLimit && (
                <p className="text-sm text-amber-600">
                  You&apos;re approaching your usage limit.
                </p>
              )}
            </div>

            {/* Collapsible Token Details */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">Token Usage Details</span>
                  {detailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Input Tokens</p>
                      <p className="text-xs text-muted-foreground">
                        $3.60/million tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{formatTokenCount(tokenTotals.inputTokens)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${((tokenTotals.inputTokens / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.input).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Output Tokens</p>
                      <p className="text-xs text-muted-foreground">
                        $18.00/million tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{formatTokenCount(tokenTotals.outputTokens)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${((tokenTotals.outputTokens / 1_000_000) * PRICING_WITH_PROFIT.CLAUDE_3_7_SONNET.output).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible Usage Estimates */}
            <Collapsible open={estimatesOpen} onOpenChange={setEstimatesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                  <span className="text-sm font-medium">Usage Estimates</span>
                  {estimatesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="rounded-lg border bg-background p-3">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Contact Search</span>
                      <span className="font-medium">~$0.05</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Generate Summary</span>
                      <span className="font-medium">~$0.02</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merge Contacts</span>
                      <span className="font-medium">~$0.01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voice Notes (30s)</span>
                      <span className="font-medium">~$0.03</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Import 100 contacts</span>
                      <span className="font-medium">~$0.10</span>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <div className="text-muted-foreground text-sm text-center py-8">
            No usage data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}