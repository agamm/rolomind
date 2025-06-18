import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorCardProps {
  error: string;
}

export function ErrorCard({ error }: ErrorCardProps) {
  return (
    <div className="max-w-md mx-auto mb-8">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Product</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or contact support at{" "}
            <a href="mailto:help@rolomind.com" className="underline">
              help@rolomind.com
            </a>{" "}
            if the issue persists.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}