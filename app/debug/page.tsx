"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";
import { useCredits } from "@/hooks/use-credits";
import { Loader2, Zap, Coins } from "lucide-react";
import { CreditCost } from "@/lib/credit-costs";

export default function DebugPage() {
  const { credits, loading: creditsLoading, refetch } = useCredits();
  const [charging, setCharging] = useState(false);
  const [message, setMessage] = useState("");

  const chargeCredits = async (amount: number) => {
    setCharging(true);
    setMessage("");
    
    try {
      const response = await authClient.usage.ingest({
        event: 'credits',
        metadata: {
          credits: amount,
        },
      });
      
      console.log('Charge response:', response);
      
      setMessage(`Successfully charged ${amount} credits`);
      
      // Refetch credits after charging
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Failed to charge credits:', error);
      setMessage('Failed to charge credits: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug Panel</h1>
      
      <div className="grid gap-6">
        {/* Credits Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Credits Status
              </div>
              <Button
                onClick={() => refetch()}
                size="sm"
                variant="outline"
              >
                <Loader2 className={`h-4 w-4 ${creditsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading credits...</span>
              </div>
            ) : credits ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                  <span className="font-medium">Remaining Credits</span>
                  <span className={`text-2xl font-bold ${credits.remaining < 0 ? 'text-red-500' : ''}`}>
                    {credits.remaining}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Used Credits</span>
                  <span className="text-sm">{credits.used}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Credits</span>
                  <span className="text-sm">{credits.total}</span>
                </div>
                {credits.remaining < 0 && (
                  <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    ⚠️ Credits overused! Additional charges may apply.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No credits data available</p>
            )}
          </CardContent>
        </Card>

        {/* Charge Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Charge Credits (Testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use these buttons to test credit charging. This simulates API usage.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => chargeCredits(1)}
                  disabled={charging}
                  variant="outline"
                >
                  {charging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Charge 1 Credit
                  <span className="text-xs ml-1">(Haiku/Whisper)</span>
                </Button>
                
                <Button
                  onClick={() => chargeCredits(2)}
                  disabled={charging}
                  variant="outline"
                >
                  {charging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Charge 5 Credits
                  <span className="text-xs ml-1">(Sonnet 3.7)</span>
                </Button>
                
                <Button
                  onClick={() => chargeCredits(10)}
                  disabled={charging}
                  variant="outline"
                >
                  {charging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Charge 10 Credits
                </Button>
                
                <Button
                  onClick={() => chargeCredits(50)}
                  disabled={charging}
                  variant="outline"
                >
                  {charging ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Charge 50 Credits
                </Button>
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('Successfully') 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit Costs Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Costs Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 rounded">
                <span>Claude 3.7 Sonnet</span>
                <span className="font-mono">2 credits</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded">
                <span>Claude 3 Haiku</span>
                <span className="font-mono">1 credit</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded">
                <span>OpenAI Whisper</span>
                <span className="font-mono">0.5 credit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Meters Debug Info */}
        <AllMetersDebug />
      </div>
    </div>
  );
}

function AllMetersDebug() {
  const [meters, setMeters] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const fetchAllMeters = async () => {
    setLoading(true);
    try {
      const response = await authClient.usage.meters.list({
        query: {
          page: 1,
          limit: 10,
        },
      });
      setMeters(response.data);
    } catch (error) {
      console.error('Failed to fetch all meters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>All Meters (Debug)</span>
          <Button
            onClick={fetchAllMeters}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Load Meters'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {meters !== null && (
          <pre className="text-xs overflow-x-auto bg-secondary p-3 rounded">
            {JSON.stringify(meters, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}