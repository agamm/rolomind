"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, CheckCircle, Code2, ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsPayingCustomer } from "@/hooks/use-is-paying-customer";
import Link from "next/link";
import { PolarProduct } from "@/types/polar";

export default function SubscribePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<PolarProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

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

  // Fetch product data from server-side API
  const fetchProductData = async () => {
    try {
      setProductLoading(true);
      
      // Fetch product data from our dedicated polar-product API
      const response = await fetch("/api/polar-product");
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          setProductData(data.product);
        }
      } else {
        setError("Unable to load product information. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching product data:", err);
      setError("Failed to load subscription details. Please contact support.");
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProductData();
    }
  }, [isAuthenticated]);

  const handleCheckout = async () => {
    if (!productData?.id) {
      setError("Product not available");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);
      const response = await authClient.checkout({
        products: [productData.id]
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

  if (authLoading || paymentLoading || productLoading) {
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
              <p className="text-destructive text-center">
                {error.includes("help@rolomind.com") ? (
                  <>
                    {error.split("help@rolomind.com")[0]}
                    <a href="mailto:help@rolomind.com" className="underline hover:no-underline">
                      help@rolomind.com
                    </a>
                    {error.split("help@rolomind.com")[1]}
                  </>
                ) : (
                  error
                )}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {productData?.name || "Rolomind Pro"}
              </CardTitle>
              <div className="text-right">
                {productData?.prices?.[0] ? (
                  <>
                    {productData.prices[0].priceAmount === 0 ? (
                      <>
                        <p className="text-3xl font-bold text-green-600">Free</p>
                        <p className="text-sm text-muted-foreground">
                          /{productData.prices[0].recurringInterval || productData.recurringInterval || "month"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold">
                          ${(productData.prices[0].priceAmount / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          /{productData.prices[0].recurringInterval || productData.recurringInterval || "month"}
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold">$5</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </>
                )}
              </div>
            </div>
            <CardDescription>
              {productData?.description || "Everything you need to find and connect with the right people"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-t pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Privacy-first locally saved contacts - we never see your contacts or notes</span>
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

            <Collapsible open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="text-sm font-medium">How it works</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isHowItWorksOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    This is just a platform fee to access the cloud version. You bring your own AI keys (OpenAI, Claude, etc.) which is best for you since we don&apos;t take any fee or profit on AI usage.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your AI costs go directly to the provider at their standard rates.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading || !productData?.id}
              size="lg"
              className="w-full"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : !productData?.id ? (
                "Product Not Available"
              ) : (
                "Subscribe Now"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No hidden fees. Pricing may change in the future.
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
                  You can always use our open source version so you could set up everything yourself.
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

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-2">
            Already have a subscription?
          </p>
          <Link href="/dashboard/app" className="text-sm text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}