import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Activity, CheckCircle } from "lucide-react";
import { getUser, getCustomerState } from "@/lib/auth/server";
import { BillingActions } from "./billing-actions";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default async function BillingPage() {
  const user = await getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const customerState = await getCustomerState();
  const activeSubscription = customerState?.activeSubscriptions?.[0];
  const hasActiveSubscription = !!activeSubscription;

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

  return (
    <>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/app">App</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Billing</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
                    <span className="font-medium">0 credits</span>
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
                <BillingActions hasSubscription={true} />
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
                <BillingActions hasSubscription={false} />
              </CardContent>
            </Card>

            {customerState && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <BillingActions variant="outline" />
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
    </>
  );
}