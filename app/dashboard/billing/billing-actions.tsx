"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

interface BillingActionsProps {
  variant?: "default" | "outline";
  hasSubscription?: boolean;
}

export function BillingActions({ variant = "default", hasSubscription = true }: BillingActionsProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
        products: ["1d51dafc-0a3f-4ed6-9b36-af44a8e15884"]
      });
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Unable to create checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // If showing portal button
  if (variant === "outline") {
    return (
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
    );
  }

  // Default: show appropriate button based on subscription status
  if (!hasSubscription) {
    return (
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
    );
  }

  return (
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
  );
}