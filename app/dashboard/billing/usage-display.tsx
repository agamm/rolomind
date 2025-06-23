"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Loader2, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  creditedAmount: number; // From $5/mo subscription
  accountBalance: number;
}

// Mock pricing based on Claude 3.5 Sonnet pricing
const PRICING = {
  inputTokensPerMillion: 3.00,  // $3 per million input tokens
  outputTokensPerMillion: 15.00, // $15 per million output tokens
};

export function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingTokens, setBuyingTokens] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimatesOpen, setEstimatesOpen] = useState(false);

  useEffect(() => {
    // Mock data - in production this would fetch from Polar's usage API
    const mockUsage: UsageData = {
      inputTokens: 1250000,  // 1.25M tokens
      outputTokens: 450000,   // 450K tokens
      totalCost: 10.50,       // Calculated from tokens
      creditedAmount: 5.00,   // From $5/mo subscription
      accountBalance: 39.50,  // Total balance remaining
    };
    
    setTimeout(() => {
      setUsage(mockUsage);
      setLoading(false);
    }, 1000);
  }, []);

  const handleBuyTokens = async () => {
    try {
      setBuyingTokens(true);
      const response = await authClient.checkout({
        products: ["cff4d713-4086-4709-8f65-d003269e8398"]
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening token checkout:", error);
      alert("Unable to open checkout. Please try again.");
    } finally {
      setBuyingTokens(false);
    }
  };

  const usagePercentage = usage ? ((usage.totalCost / (usage.creditedAmount + usage.accountBalance)) * 100) : 0;
  const isLowBalance = usage && usage.accountBalance < 10;

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
            {/* Main Balance Display */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    ${usage.accountBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Balance remaining</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    ${usage.totalCost.toFixed(2)} used
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ${(usage.creditedAmount + usage.accountBalance).toFixed(2)} total
                  </p>
                </div>
              </div>
              
              <Progress 
                value={100 - usagePercentage} 
                className="h-3"
                style={{
                  // @ts-ignore - CSS variable
                  '--progress-background': isLowBalance ? 'hsl(var(--destructive))' : undefined
                }}
              />
              
              {isLowBalance && (
                <p className="text-sm text-amber-600">
                  Low balance! Consider buying more tokens.
                </p>
              )}
            </div>

            {/* Buy More Tokens Button */}
            <Button
              onClick={handleBuyTokens}
              disabled={buyingTokens}
              className="w-full"
              variant={isLowBalance ? "default" : "outline"}
            >
              {buyingTokens ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Buy More AI Tokens
                </>
              )}
            </Button>

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