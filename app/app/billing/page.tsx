"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, CreditCard, Activity, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { TopNav } from "@/components/layout";

interface CustomerState {
  id: string;
  email: string;
  name: string | null;
  activeSubscriptions: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    recurringInterval: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    productId: string;
    meters: Array<{
      consumedUnits: number;
      creditedUnits: number;
      amount: number;
    }>;
  }>;
  activeMeters: Array<{
    consumedUnits: number;
    creditedUnits: number;
    balance: number;
  }>;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const activeSubscription = customerState?.activeSubscriptions?.[0];
  const hasActiveSubscription = activeSubscription?.status === 'active';
  const meterData = customerState?.activeMeters?.[0];

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
              <div className="space-y-6">
                {hasActiveSubscription ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Active Subscription
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Plan</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Rolomind Pro</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-medium">
                            {formatPrice(activeSubscription.amount, activeSubscription.currency)}/{activeSubscription.recurringInterval}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Current Period</span>
                          <span className="text-sm">
                            {formatDate(activeSubscription.currentPeriodStart)} - {formatDate(activeSubscription.currentPeriodEnd)}
                          </span>
                        </div>
                        
                        {activeSubscription.cancelAtPeriodEnd && (
                          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                            Your subscription will cancel at the end of the current billing period
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Usage This Period
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">API Credits Used</span>
                            <span className="font-medium">{meterData?.consumedUnits || 0} credits</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Additional usage is billed at the end of each billing period
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Manage Subscription</CardTitle>
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
                        <p className="text-sm text-muted-foreground mt-3 text-center">
                          Update payment method, download invoices, or cancel subscription
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="border-primary">
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

                    {customerState && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Customer Portal</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={handleOpenPortal}
                            disabled={portalLoading}
                            className="w-full"
                            variant="outline"
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
                    )}
                  </>
                )}

                <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                  <p>
                    Need help? Contact support at{" "}
                    <a href="mailto:help@rolomind.com" className="underline">
                      help@rolomind.com
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}