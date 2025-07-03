"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";
import { useRouter } from "next/navigation";
import { PolarDebugResponse } from "@/types/polar";

export default function PolarProductsDebugPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const [productsData, setProductsData] = useState<PolarDebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Product ID from better-auth settings
  const configuredProductId = "1d51dafc-0a3f-4ed6-9b36-af44a8e15884";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchPolarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch products from Polar API through our backend
      const response = await fetch("/api/debug/polar-products");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProductsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Polar products");
      console.error("Error fetching Polar products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPolarData();
    }
  }, [isAuthenticated]);

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
          <h1 className="text-3xl font-bold mb-2">Polar Products Debug</h1>
          <p className="text-muted-foreground">
            Raw JSON data from Polar API showing products and their details
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configured Product ID (from better-auth settings)</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
              {configuredProductId}
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Polar Products Data</CardTitle>
            <Button
              onClick={fetchPolarData}
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
              <div className="bg-destructive/10 text-destructive p-4 rounded">
                Error: {error}
              </div>
            )}
            
            {!loading && !error && productsData && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-sm font-medium mb-2">Product ID Match Status:</p>
                  {productsData?.products?.some((p) => p.id === configuredProductId) ? (
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      ✓ Configured product ID found in Polar products
                    </p>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      ✗ Configured product ID not found in Polar products
                    </p>
                  )}
                </div>
                
                <pre className="bg-muted/50 p-4 rounded overflow-x-auto text-xs">
                  {JSON.stringify(productsData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            This debug page is for development only. Remove in production.
          </p>
        </div>
      </div>
    </div>
  );
}