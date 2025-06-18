"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { TopNav } from "@/components/layout";

export default function BillingPage() {
  const { data: session } = useSession();
  const [customerState, setCustomerState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResponse, setCheckoutResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerState = async () => {
      try {
        const { data } = await authClient.customer.state();
        setCustomerState(data);
      } catch (error) {
        console.error("Error fetching customer state:", error);
        setError("Unable to load billing information");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchCustomerState();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await authClient.customer.portal();
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      alert("Unable to open customer portal. Please try again later.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const response = await authClient.checkout({
        products: ["3edbd9f4-735b-49d6-96aa-1fbe47a39908"]
      });
      setCheckoutResponse(response);
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

  const hasActiveSubscription = customerState?.activeSubscriptions?.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">
          <TopNav
            contactCount={0}
            onFileSelect={() => {}}
            isImporting={false}
            disabled={false}
          />
          
          <div className="max-w-4xl mx-auto w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Billing</h1>
              <p className="text-muted-foreground">
                Manage your subscription and billing details
              </p>
            </div>

            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Customer State</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto">
                      {JSON.stringify(customerState, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                {!hasActiveSubscription && (
                  <Card className="mb-6 border-primary">
                    <CardHeader>
                      <CardTitle>Subscribe to Rolomind Pro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold">$5/month</p>
                        <p className="text-muted-foreground">+ additional usage based pricing</p>
                      </div>
                      <Button
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
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
                    </CardContent>
                  </Card>
                )}

                {checkoutResponse && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Checkout Response (Debug)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-auto">
                        {JSON.stringify(checkoutResponse, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Portal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleOpenPortal}
                      disabled={portalLoading}
                      className="w-full"
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Customer Portal
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}