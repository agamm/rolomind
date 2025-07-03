"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings } from "lucide-react";
import Link from "next/link";
import { useApiKeysStatus } from "@/hooks/use-api-keys-status";

export function ApiKeysWarning() {
  const { hasOpenrouterKey, isLoading } = useApiKeysStatus();

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Don't show warning if OpenRouter key is configured
  if (hasOpenrouterKey) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-medium text-amber-800 dark:text-amber-200">
              AI features disabled
            </span>
            <span className="text-amber-700 dark:text-amber-300 ml-2">
              Configure your OpenRouter API key to enable AI-powered contact search, merging, and processing.
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/dashboard/ai-keys">
              <Settings className="h-4 w-4 mr-2" />
              Configure Keys
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}