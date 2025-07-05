"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { useOpenRouterCredits } from "@/hooks/use-openrouter-credits";
import Link from "next/link";

export function OpenRouterCredits() {
  const { data: credits, isLoading, error, refetch, isRefetching } = useOpenRouterCredits();

  if (error) {
    if (error.message.includes('not configured')) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              OpenRouter Credits
            </CardTitle>
            <CardDescription>
              View your OpenRouter API usage and remaining credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Configure your OpenRouter API key to view credits</span>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/dashboard/ai-keys">
                Configure API Keys
              </Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            OpenRouter Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Failed to load credits: {error.message}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-3"
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              OpenRouter Credits
            </CardTitle>
            <CardDescription>
              Your current OpenRouter API usage and remaining credits
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          </div>
        ) : credits ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Remaining Credits</p>
                <p className="text-2xl font-bold text-purple-600">${(credits.data.total_credits - credits.data.total_usage).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold text-purple-600">${credits.data.total_usage?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Total Credits: ${credits.data.total_credits?.toFixed(2) || '0.00'}</p>
            </div>
            
            <div className="pt-4 border-t">
              <Button asChild variant="outline" size="sm">
                <Link href="https://openrouter.ai/credits" target="_blank" className="inline-flex items-center gap-2">
                  Manage Credits
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}