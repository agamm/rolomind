"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Loader2, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UsageData {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  monthlyLimit: number;
}

// Mock pricing based on Claude 3.5 Sonnet pricing
const PRICING = {
  inputTokensPerMillion: 3.00,  // $3 per million input tokens
  outputTokensPerMillion: 15.00, // $15 per million output tokens
};

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would fetch from Polar's usage API
    const mockUsage: UsageData = {
      inputTokens: 1250000,  // 1.25M tokens
      outputTokens: 450000,   // 450K tokens
      totalCost: 10.50,       // Calculated from tokens
      monthlyLimit: 50.00,    // $50 monthly limit
    };
    
    setTimeout(() => {
      setUsage(mockUsage);
      setLoading(false);
    }, 1000);
  }, []);

  const calculateCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = (inputTokens / 1_000_000) * PRICING.inputTokensPerMillion;
    const outputCost = (outputTokens / 1_000_000) * PRICING.outputTokensPerMillion;
    return inputCost + outputCost;
  };

  const usagePercentage = usage ? (usage.totalCost / usage.monthlyLimit) * 100 : 0;
  const isHighUsage = usage && usagePercentage > 80;

  const formatTokenCount = (count: number) => {
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(2)}M`;
    } else if (count >= 1_000) {
      return `${(count / 1_000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : usage ? (
          <>
            {/* Cost Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold flex items-center">
                    <DollarSign className="h-6 w-6" />
                    {usage.totalCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Current usage</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    of ${usage.monthlyLimit.toFixed(2)} limit
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(100 - usagePercentage).toFixed(0)}% remaining
                  </p>
                </div>
              </div>
              
              <Progress value={usagePercentage} className="h-3" />
            </div>

            {/* High Usage Alert */}
            {isHighUsage && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You've used over 80% of your monthly limit. Usage will be throttled if you exceed the limit.
                </AlertDescription>
              </Alert>
            )}

            {/* Token Usage Breakdown */}
            <div className="rounded-lg border bg-muted/30 p-5">
              <h4 className="font-semibold text-sm mb-4">Token Usage Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Input Tokens</p>
                    <p className="text-xs text-muted-foreground">
                      ${PRICING.inputTokensPerMillion.toFixed(2)}/million
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{formatTokenCount(usage.inputTokens)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${((usage.inputTokens / 1_000_000) * PRICING.inputTokensPerMillion).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Output Tokens</p>
                    <p className="text-xs text-muted-foreground">
                      ${PRICING.outputTokensPerMillion.toFixed(2)}/million
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">{formatTokenCount(usage.outputTokens)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${((usage.outputTokens / 1_000_000) * PRICING.outputTokensPerMillion).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Guide */}
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Usage Estimates</h4>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Contact Search (avg)</span>
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
                    <span className="text-muted-foreground">Import 100 contacts (AI)</span>
                    <span className="font-medium">~$0.10</span>
                  </div>
                </div>
              </div>
            </div>
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