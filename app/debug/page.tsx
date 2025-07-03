"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsPayingCustomer } from "@/hooks/use-is-paying-customer";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { PolarDebugResponse, PolarProduct } from "@/types/polar";
import { env } from "@/lib/env";

export default function DebugPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const [debugData, setDebugData] = useState<PolarDebugResponse | null>(null);
  const [productData, setProductData] = useState<PolarProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product ID from client-side environment variable
  const configuredProductId = env.NEXT_PUBLIC_POLAR_PRODUCT_ID || null;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);

  // Note: Polar client doesn't expose products.get() on client-side
  // Available methods are: checkout(), customer.portal(), customer.benefits.list(), etc.
  const fetchProductData = async () => {
    // Product data is fetched via server-side API, not client-side
    // The auth client only provides specific methods like checkout and portal
    console.log("Available auth client methods: checkout(), customer.portal()");
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [debugRes, productRes] = await Promise.all([
          fetch("/api/debug/polar-products"),
          fetch("/api/polar-product")
        ]);
        
        if (debugRes.ok) {
          const data: PolarDebugResponse = await debugRes.json();
          setDebugData(data);
        }
        
        if (productRes.ok) {
          const data = await productRes.json();
          setProductData(data.product);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch debug data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  // Protect debug page in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Debug pages are not available in production.
            </p>
            <Link href="/dashboard/app">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading) {
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Debug Information</h1>
          <p className="text-muted-foreground">
            Authentication and Polar integration debug data
          </p>
        </div>

        <div className="grid gap-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify({
                  isAuthenticated,
                  isPayingCustomer,
                  user: user || null,
                  authLoading,
                  paymentLoading
                }, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Product Data from POLAR_PRODUCT_ID */}
          {productData && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Product Data (from POLAR_PRODUCT_ID)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Product Name:</p>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {productData.name}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Product ID:</p>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {productData.id}
                    </code>
                  </div>
                  {productData.description && (
                    <div>
                      <p className="text-sm font-medium mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground">{productData.description}</p>
                    </div>
                  )}
                  {productData.prices && productData.prices.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Price:</p>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {productData.prices[0].priceAmount === 0 ? "Free" : `$${(productData.prices[0].priceAmount / 100).toFixed(2)}`}/{productData.prices[0].recurringInterval}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Auth Client Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Available Auth Client Methods (Polar Integration)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Product ID (from NEXT_PUBLIC_POLAR_PRODUCT_ID):</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {configuredProductId || "Not set"}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Available Client-side Methods:</p>
                  <div className="bg-muted/50 p-4 rounded text-xs space-y-1">
                    <div>• <code>authClient.checkout()</code> - Create checkout sessions</div>
                    <div>• <code>authClient.customer.portal()</code> - Access customer portal</div>
                    <div>• <code>authClient.customer.benefits.list()</code> - List customer benefits</div>
                    <div>• <code>authClient.customer.orders.list()</code> - List customer orders</div>
                    <div>• <code>authClient.customer.subscriptions.list()</code> - List subscriptions</div>
                    <div>• <code>authClient.usage.ingest()</code> - Track usage events</div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Note:</strong> The Polar client does NOT expose <code>products.get()</code> on the client-side. 
                    Product data must be fetched via server-side APIs using the Polar SDK.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Better Auth Config */}
          <Card>
            <CardHeader>
              <CardTitle>Better Auth Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Product ID (from POLAR_PRODUCT_ID env):</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {configuredProductId || "Not set"}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Product Slug:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    rolomind-cloud
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Success URL:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    /subscribe/success?checkout_id={"{CHECKOUT_ID}"}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info (All Products) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Debug Info</CardTitle>
              <Button
                onClick={() => window.location.reload()}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!loading && debugData && (
                <div className="space-y-4">
                  {debugData.error && (
                    <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded">
                      <p className="font-medium">{debugData.error}</p>
                      {debugData.message && <p className="text-sm mt-1">{debugData.message}</p>}
                    </div>
                  )}
                  
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Configuration Status:</p>
                    <div className="text-sm space-y-1">
                      <div>Server: <code className="bg-muted px-1 rounded">{debugData.polarServer}</code></div>
                      <div>Configured Product ID: <code className="bg-muted px-1 rounded">{debugData.configuredProductId || "Not set"}</code></div>
                      <div>Total Products: {debugData.totalProducts}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link href="/subscribe">
                  <Button variant="outline" size="sm">
                    Go to Subscribe Page
                  </Button>
                </Link>
                <Link href="/dashboard/app">
                  <Button variant="outline" size="sm">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      // Use the correct method from our billing actions
                      const response = await authClient.customer.portal();
                      if (response.data?.url) {
                        window.location.href = response.data.url;
                      }
                    } catch (err) {
                      console.error("Error opening portal:", err);
                    }
                  }}
                >
                  Open Customer Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            This debug page is for development only. Remove in production.
          </p>
        </div>
      </div>
    </div>
  );
}