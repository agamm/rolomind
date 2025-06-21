"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus, Loader2, Info } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">Failed to load credits</div>
        ) : credits ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{credits.remaining}</p>
                <p className="text-sm text-muted-foreground">Remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{credits.used}</p>
                <p className="text-sm text-muted-foreground">Used</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{credits.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            
            {credits.remaining === 0 && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm text-center">
                You have no credits remaining. Add more credits to continue using AI features.
              </div>
            )}
            
            {credits.remaining > 0 && credits.remaining < 10 && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm text-center">
                You have {credits.remaining} credits remaining. Consider adding more credits soon.
              </div>
            )}
            
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Credit Package</p>
                  <p className="text-sm text-muted-foreground">100 credits for $10</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">$10</p>
                  <p className="text-xs text-muted-foreground">$0.10 per credit</p>
                </div>
              </div>
              
              <Button 
                onClick={handleAddCredits} 
                disabled={addingCredits}
                className="w-full"
                variant={credits.remaining === 0 ? "default" : "outline"}
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

            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span className="font-medium">Credit usage guide:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pl-6">
                <div>• Full search: 5 credits</div>
                <div>• Summary only: 1 credit</div>
                <div>• Merge contacts: 1 credit</div>
                <div>• Voice notes: 1 credit</div>
                <div>• Import 100 contacts: 1 credit</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground text-sm text-center py-4">
            No credit data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}