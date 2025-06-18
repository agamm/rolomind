"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Calendar, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { TopNav } from "@/components/layout";
import { PricingCard, LoadingState, ErrorCard, type ProductInfo } from "@/components/billing";

interface Subscription {
  id: string;
  status: string;
  productId: string;
  productName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Order {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  productName: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [currentMonthSpend, setCurrentMonthSpend] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check subscription status and get customer details
        const customerState = await authClient.customer.state();
        
        if (customerState.data) {
          // Get customer email
          if (customerState.data.email) {
            setCustomerEmail(customerState.data.email);
          }

          // Check for active subscriptions
          const activeSubscriptions = customerState.data.subscriptions?.filter(
            (sub: any) => sub.status === "active" || sub.status === "trialing"
          );
          
          if (activeSubscriptions && activeSubscriptions.length > 0) {
            setHasActiveSubscription(true);
            const sub = activeSubscriptions[0];
            setActiveSubscription({
              id: sub.id,
              status: sub.status,
              productId: sub.productId,
              productName: sub.product?.name || "Subscription",
              currentPeriodEnd: sub.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
            });
          }

          // Get recent orders and calculate spending
          if (customerState.data.orders) {
            const allOrders = customerState.data.orders;
            
            // Calculate total spend
            const total = allOrders.reduce((sum: number, order: any) => {
              return sum + (order.amount / 100);
            }, 0);
            setTotalSpend(total);

            // Calculate current month spend
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthSpend = allOrders
              .filter((order: any) => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === currentMonth && 
                       orderDate.getFullYear() === currentYear;
              })
              .reduce((sum: number, order: any) => {
                return sum + (order.amount / 100);
              }, 0);
            setCurrentMonthSpend(monthSpend);

            // Get recent orders for display
            const recentOrdersList = allOrders.slice(0, 5).map((order: any) => ({
              id: order.id,
              amount: order.amount / 100, // Convert cents to dollars
              currency: order.currency,
              createdAt: order.createdAt,
              productName: order.product?.name || "Order",
            }));
            setRecentOrders(recentOrdersList);
          }
        }

        // Fetch product info
        const productResponse = await fetch('/api/polar/products');
        const productData = await productResponse.json();
        
        if (productData.success && productData.product) {
          setProductInfo(productData.product);
        } else {
          setProductError(productData.error || "Failed to load product information");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setProductError("Unable to load billing information. Please contact support at help@rolomind.com");
      } finally {
        setCheckingSubscription(false);
        setLoadingProduct(false);
      }
    };

    if (session) {
      fetchData();
    } else {
      setCheckingSubscription(false);
      setLoadingProduct(false);
    }
  }, [session]);

  const handleSubscribe = async () => {
    try {
      setLoadingPlan("subscribe");
      
      const response = await authClient.checkout({
        slug: "rolomind-pro",
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Unable to create checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoadingPlan("manage");
      
      const response = await authClient.customer.portal();

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      alert("Unable to open customer portal. Please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
              {customerEmail && (
                <p className="text-sm text-muted-foreground mt-2">
                  Billing account: {customerEmail}
                </p>
              )}
            </div>

            {loadingProduct || checkingSubscription ? (
              <LoadingState />
            ) : productError ? (
              <ErrorCard error={productError} />
            ) : (
              <>
                {/* Spending Overview */}
                {(totalSpend > 0 || activeSubscription) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Spend
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          This Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${currentMonthSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Active Subscription Card */}
                {activeSubscription && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Current Subscription
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <span className="font-medium">{activeSubscription.productName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">
                          {activeSubscription.status}
                          {activeSubscription.cancelAtPeriodEnd && (
                            <span className="text-amber-600 ml-2">(Canceling)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Next billing date</span>
                        <span className="font-medium">
                          {formatDate(activeSubscription.currentPeriodEnd)}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleManageSubscription}
                        disabled={loadingPlan === "manage"}
                      >
                        {loadingPlan === "manage" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Manage Subscription"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Product Card */}
                {productInfo ? (
                  <PricingCard
                    product={productInfo}
                    hasActiveSubscription={hasActiveSubscription}
                    checkingSubscription={checkingSubscription}
                    onSubscribe={handleSubscribe}
                    onManage={handleManageSubscription}
                    loading={loadingPlan}
                  />
                ) : !hasActiveSubscription && (
                  <Card className="border-amber-500/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        No Product Information Available
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Unable to load subscription plans. Please contact support at{" "}
                        <a href="mailto:help@rolomind.com" className="underline">
                          help@rolomind.com
                        </a>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Recent Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">{order.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <span className="font-medium">
                              ${order.amount} {order.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!hasActiveSubscription && !checkingSubscription && (
                  <div className="text-center space-y-4 mt-8">
                    <p className="text-sm text-muted-foreground">
                      Already have a subscription?
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loadingPlan === "manage"}
                    >
                      {loadingPlan === "manage" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Access Customer Portal
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
                  <p>
                    Powered by{" "}
                    <a href="https://polar.sh" target="_blank" rel="noopener noreferrer" className="underline">
                      Polar
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}