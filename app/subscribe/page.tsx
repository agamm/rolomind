"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, Code2, ChevronDown, ChevronUp } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsPayingCustomer } from "@/hooks/use-is-paying-customer";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PRICING_WITH_PROFIT, formatPricingWithBase, BASE_PRICING, OPERATION_ESTIMATES } from "@/lib/config";

export default function SubscribePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingDetailsOpen, setPricingDetailsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && !paymentLoading && isAuthenticated && isPayingCustomer) {
      router.push("/dashboard/app");
    }
  }, [authLoading, paymentLoading, isAuthenticated, isPayingCustomer, router]);

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      setError(null);
      const response = await authClient.checkout({
        products: ["1d51dafc-0a3f-4ed6-9b36-af44a8e15884"]
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      setError("Unable to create checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (authLoading || paymentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Transparent AI-powered contact management with pay-per-use pricing
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">AI Usage Plan</CardTitle>
              <div className="text-right">
                <p className="text-3xl font-bold">Pay per use</p>
                <p className="text-sm text-muted-foreground">Claude 3.7 Sonnet</p>
                <p className="text-xs text-muted-foreground">$10/month cap (adjustable)</p>
              </div>
            </div>
            <CardDescription>
              Transparent AI usage pricing with no surprises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Store up to 10,000 contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export contacts to CSV anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">AI-powered contact search and management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Voice notes with AI processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">AI contact merging and deduplication</span>
                </div>
              </div>
            </div>

            <Collapsible open={pricingDetailsOpen} onOpenChange={setPricingDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-muted/50 hover:bg-muted/70">
                  <div className="text-left">
                    <p className="text-sm font-medium">Transparent Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Claude 3.7 Sonnet costs + 20% profit margin
                    </p>
                  </div>
                  {pricingDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      We charge Claude 3.7 Sonnet token costs + 20% profit margin. You only pay for what you use.
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Input tokens: {formatPricingWithBase(BASE_PRICING.CLAUDE_3_7_SONNET.input)}</p>
                      <p>• Output tokens: {formatPricingWithBase(BASE_PRICING.CLAUDE_3_7_SONNET.output)}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Cost Examples</p>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <div className="flex justify-between">
                        <span>Search 1,000 contacts:</span>
                        <span className="font-medium">~${(OPERATION_ESTIMATES.SEARCH_1000_CONTACTS / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Generate summary:</span>
                        <span className="font-medium">~${(OPERATION_ESTIMATES.GENERATE_SUMMARY / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Merge 2 contacts:</span>
                        <span className="font-medium">~${(OPERATION_ESTIMATES.MERGE_CONTACTS / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voice note (30s):</span>
                        <span className="font-medium">~${(OPERATION_ESTIMATES.VOICE_NOTE_30S / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Import 100 contacts:</span>
                        <span className="font-medium">~${(100 * OPERATION_ESTIMATES.IMPORT_PER_CONTACT).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Usage Cap Protection</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Default $10/month spending cap prevents surprises. You can adjust this limit anytime in your billing settings.
              </p>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              size="lg"
              className="w-full"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Using AI Features"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </CardContent>
        </Card>


        <Card className="mt-8 bg-muted/30 border-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Code2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Technical user? Pricing not working for you?
                </p>
                <p className="text-sm text-muted-foreground">
                  You can always use our open source version with your own API keys.
                </p>
                <Link 
                  href="https://github.com/agamm/rolomind" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View on GitHub →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}