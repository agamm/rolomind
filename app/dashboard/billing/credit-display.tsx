"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus, Loader2, Info, AlertCircle } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreditDisplay() {
  const { credits, loading, error } = useCredits();
  const [addingCredits, setAddingCredits] = useState(false);

  const handleAddCredits = async () => {
    try {
      setAddingCredits(true);
      // Use the credits product ID for checkout
      const response = await authClient.checkout({
        products: ["c190ea01-fa92-48a8-a274-5b9ea9fbd756"]
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening credit checkout:", error);
      alert("Unable to open checkout. Please try again.");
    } finally {
      setAddingCredits(false);
    }
  };

  const creditPercentage = credits ? (credits.remaining / credits.total) * 100 : 0;
  const isLowCredits = credits && credits.remaining < 10;
  const isNoCredits = credits && credits.remaining === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load credits. Please refresh the page.</AlertDescription>
          </Alert>
        ) : credits ? (
          <>
            {/* Credit Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {credits.remaining.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Credits remaining</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {credits.used.toLocaleString()} of {credits.total.toLocaleString()} used
                  </p>
                </div>
              </div>
              
              <Progress value={100 - creditPercentage} className="h-3" />
            </div>

            {/* Status Alerts */}
            {isNoCredits && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have no credits remaining. Add more credits to continue using AI features.
                </AlertDescription>
              </Alert>
            )}
            
            {!isNoCredits && isLowCredits && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only {credits.remaining} credits remaining. Consider adding more soon.
                </AlertDescription>
              </Alert>
            )}

            {/* Purchase Option */}
            <div className="rounded-lg border bg-muted/30 p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">Credit Package</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      100 credits for instant use
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$10</p>
                    <p className="text-xs text-muted-foreground">$0.10/credit</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddCredits} 
                  disabled={addingCredits}
                  className="w-full"
                  size="lg"
                  variant={isNoCredits ? "default" : "outline"}
                >
                  {addingCredits ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Buy 100 Credits
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Usage Guide */}
            <div className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Credit Usage Guide</h4>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full AI search</span>
                    <span className="font-medium">5 credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Summary only</span>
                    <span className="font-medium">1 credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merge contacts</span>
                    <span className="font-medium">1 credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voice notes</span>
                    <span className="font-medium">1 credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Import 100 contacts</span>
                    <span className="font-medium">1 credit</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground text-sm text-center py-8">
            No credit data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}