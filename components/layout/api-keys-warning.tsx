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
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0.5" />
      <AlertDescription>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="block sm:inline">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                AI features disabled
              </span>
            </div>
            <div className="block sm:inline sm:ml-2 text-sm sm:text-inherit">
              <span className="text-amber-700 dark:text-amber-300">
                Configure your OpenRouter API key to enable AI-powered contact search, merging, and processing.
              </span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 h-9 sm:h-8 touch-manipulation w-full sm:w-auto">
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