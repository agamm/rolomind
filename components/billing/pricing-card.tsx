import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export interface ProductInfo {
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

interface PricingCardProps {
  product: ProductInfo;
  hasActiveSubscription: boolean;
  checkingSubscription: boolean;
  onSubscribe: () => void;
  onManage: () => void;
  loading: string | null;
}

export function PricingCard({ 
  product, 
  hasActiveSubscription,
  checkingSubscription,
  onSubscribe,
  onManage,
  loading
}: PricingCardProps) {
  return (
    <div className="max-w-md mx-auto mb-8">
      <Card className="border-primary shadow-lg">
        <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium rounded-t-lg">
          Pro Plan
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{product.name}</CardTitle>
          <CardDescription>
            <span className="text-4xl font-bold">
              ${product.price}
            </span>
            <span className="text-muted-foreground ml-2">
              per {product.interval}
            </span>
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            Everything you need to manage your contacts with AI
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {checkingSubscription ? (
            <Button className="w-full" size="lg" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking subscription...
            </Button>
          ) : hasActiveSubscription ? (
            <Button
              className="w-full"
              size="lg"
              variant="secondary"
              onClick={onManage}
              disabled={loading !== null}
            >
              {loading === "manage" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Active Subscription
                </>
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={onSubscribe}
              disabled={loading !== null}
            >
              {loading === "subscribe" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}