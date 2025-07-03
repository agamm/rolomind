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
import { PolarDebugResponse } from "@/types/polar";

export default function DebugPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useIsAuthenticated();
  const { isPayingCustomer, isLoading: paymentLoading } = useIsPayingCustomer();
  const [debugData, setDebugData] = useState<PolarDebugResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product ID from environment variable
  const [configuredProductId, setConfiguredProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch debug data
      const response = await fetch("/api/debug/polar-products");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PolarDebugResponse = await response.json();
      setDebugData(data);
      // Get the configured product ID from the response
      if (data.configuredProductId) {
        setConfiguredProductId(data.configuredProductId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch debug data");
      console.error("Error fetching debug data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDebugData();
    }
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

          {/* Polar Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Polar Products Data</CardTitle>
              <Button
                onClick={fetchDebugData}
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
                  
                  {debugData?.products && debugData.products.length > 0 && configuredProductId && (
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-sm font-medium mb-2">Product ID Match Status:</p>
                      {debugData.products.some((p) => p.id === configuredProductId) ? (
                        <p className="text-green-600 dark:text-green-400 text-sm">
                          ✓ Configured product ID found in Polar products
                        </p>
                      ) : (
                        <p className="text-red-600 dark:text-red-400 text-sm">
                          ✗ Configured product ID not found in Polar products
                        </p>
                      )}
                    </div>
                  )}
                  
                  <pre className="bg-muted/50 p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
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
                      // Try to access portal method if available
                      const authClientWithPortal = authClient as { portal?: () => Promise<{ data?: { url?: string } }> };
                      if (authClientWithPortal.portal) {
                        const response = await authClientWithPortal.portal();
                        if (response.data?.url) {
                          window.location.href = response.data.url;
                        }
                      } else {
                        console.log("Portal not available - check Polar configuration");
                      }
                    } catch (err) {
                      console.error("Error opening portal:", err);
                    }
                  }}
                >
                  Open Billing Portal
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