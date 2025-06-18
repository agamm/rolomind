"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get("checkout_id");

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/app");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-4">
          Thank you for your subscription. Your account has been upgraded.
        </p>
        {checkoutId && (
          <p className="text-sm text-muted-foreground mb-4">
            Checkout ID: {checkoutId}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard in 5 seconds...
        </p>
        <Button
          onClick={() => router.push("/app")}
          className="mt-4"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}