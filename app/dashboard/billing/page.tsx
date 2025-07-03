import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, AlertCircle, Receipt } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { OpenRouterCredits } from "@/components/billing/openrouter-credits";

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
      <Breadcrumb className="mb-6">
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Rolomind Cloud subscription
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* OpenRouter Credits */}
          <OpenRouterCredits />
          
          {/* Subscription Section */}
          <div>
            {hasActiveSubscription ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium mt-1">Rolomind Cloud</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium mt-1">
                          {formatPrice(activeSubscription.amount, activeSubscription.currency)}/{activeSubscription.recurringInterval}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current billing period</p>
                      <p className="text-sm">
                        {formatDate(activeSubscription.currentPeriodStart.toString())} → {formatDate(activeSubscription.currentPeriodEnd?.toString() || '')}
                      </p>
                    </div>
                    
                    {activeSubscription.cancelAtPeriodEnd && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription will cancel at the end of the current billing period on {formatDate(activeSubscription.currentPeriodEnd?.toString() || '')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Manage Subscription Actions */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Update payment method, download invoices, or cancel subscription
                    </p>
                    <BillingActions hasSubscription={true} />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Subscribe Card */}
                <Card className="border-primary/50 shadow-sm">
                  <CardHeader>
                    <CardTitle>Subscribe to Rolomind Cloud</CardTitle>
                    <CardDescription>
                      Bring your own AI keys for hosting and deployment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">$2.99</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Fixed pricing for hosting and deployment. Use your own AI API keys.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">What&apos;s included:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Unlimited contact storage</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Advanced search and filters</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>AI-powered features (use your own API keys)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Hosted and deployed infrastructure</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>Priority support</span>
                          </li>
                        </ul>
                      </div>
                      
                      <BillingActions hasSubscription={false} />
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Portal Access */}
                {customerState && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Billing History
                      </CardTitle>
                      <CardDescription>
                        Access your invoices and payment history
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BillingActions variant="outline" />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Support Section */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Need help with billing?
              </p>
              <p className="text-sm">
                Contact support at{" "}
                <a href="mailto:help@rolomind.com" className="text-primary underline underline-offset-4">
                  help@rolomind.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}