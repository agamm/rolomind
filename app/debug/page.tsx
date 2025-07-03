"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useIsPayingCustomer } from "@/hooks/use-is-paying-customer";
import { usePolarProduct } from "@/hooks/use-polar-product";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { useEffect } from "react";

export default function DebugPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const { productData, loading, error } = usePolarProduct();


  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);


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

  if (authLoading || loading) {
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
          {productData ? (
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
                  <div>
                    <p className="text-sm font-medium mb-1">Price:</p>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {productData.price === 0 ? "Free" : `$${(productData.price / 100).toFixed(2)}`}/{productData.recurringInterval}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          )}


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
            This debug page is for development only. Blocked in production.
          </p>
        </div>
      </div>
    </div>
  );
}