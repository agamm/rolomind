"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast.error("Please accept the terms of service to continue");
      return;
    }
    
    setIsLoading(true);

    try {
      await signUp.email({
        email,
        password,
        name,
      });
      
      toast.success("Account created successfully!");
      router.push("/app");
    } catch (error) {
      console.error("Sign up error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen">
      <div className="container flex min-h-screen w-screen items-center justify-center py-8">
        <div className="flex w-full max-w-5xl gap-12 items-center justify-center">
          <div className="flex-1 max-w-md mx-auto">
            <Card className="w-full border-border/50">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-semibold text-center">Create an account</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Start managing your contacts with AI
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className="h-11 bg-background"
                    />
                  </div>
                  <div className="flex items-start space-x-3 pt-1">
                    <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                disabled={isLoading}
                className="mt-0.5 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                    />
                    <Label 
                htmlFor="terms" 
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed flex-1"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline font-medium" target="_blank">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline font-medium" target="_blank">
                  Privacy Policy
                </Link>
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-2">
                  <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        
        <div className="flex-1 max-w-md hidden lg:block mx-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">Why Rolomind?</h2>
              <p className="text-muted-foreground">
                Find anyone in your network instantly with natural language—while keeping your data completely private.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Contact-Focused</h3>
                  <p className="text-sm text-muted-foreground">
                    Built exclusively for contact management. Every feature is optimized for enriching contacts.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Private & Local-First</h3>
                  <p className="text-sm text-muted-foreground">
                    Your contacts never leave your local browser. Big tech companies can't promise that.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real Workflows</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit contacts, bulk operations, CSV imports/exports—actual tools for managing contacts, not just chat.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">No Lock-In</h3>
                  <p className="text-sm text-muted-foreground">
                    Export everything anytime. Your contacts are yours, not trapped in a chat history.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground italic">
                "Open source, sustainably priced, built for people not profits. No VC funding, just honest software that works."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="fixed bottom-8 left-0 right-0 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}