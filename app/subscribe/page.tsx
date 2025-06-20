"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, Code2 } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsPayingCustomer } from "@/hooks/use-is-paying-customer";
import Link from "next/link";

export default function SubscribePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        products: ["3edbd9f4-735b-49d6-96aa-1fbe47a39908"]
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
            Start finding the contacts you need with Rolomind Pro
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
              <CardTitle className="text-2xl">Rolomind Pro</CardTitle>
              <div className="text-right">
                <p className="text-3xl font-bold">$5</p>
                <p className="text-sm text-muted-foreground">/month</p>
                <p className="text-xs text-muted-foreground">+ usage-based AI calls</p>
              </div>
            </div>
            <CardDescription>
              Everything you need to find and connect with the right people
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">20 free searches per month + usage-based AI calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export contacts to CSV whenever you want</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Priority support</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">How it works</p>
              <p className="text-sm text-muted-foreground">
                The $5/month platform fee includes pre-loaded AI credits for approximately 20 queries. 
                After that, additional AI usage is billed based on actual consumption.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can view your usage in the billing page at any time.
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
                "Subscribe Now"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Already have a subscription?
          </p>
          <Link href="/dashboard/app" className="text-sm text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>

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