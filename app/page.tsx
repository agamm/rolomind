"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { DemoImport, DemoSearch, DemoResults, DemoVoiceEdit, DemoProvider, DemoWrapper } from "@/components/landing";
import { Header } from "@/components/layout/header";
import { 
  Shield, 
  Search, 
  Users, 
  GithubIcon, 
  DollarSign,
  Sparkles,
  Lock,
  Database,
  Globe,
  CheckCircle,
  ArrowRight,
  Play,
  FileText,
  HeadphonesIcon,
  Server,
  Cloud,
  Import,
  Brain,
  Eye,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Why did you make Rolomind?",
      answer: "I built Rolomind to find people I might've not thought about when I was in the midst of co-founder dating. I wanted a privacy-first solution that actually worked, and I wanted to make something real—even if it doesn't make much money. Sometimes the best tools come from solving your own problems."
    },
    {
      question: "What's the goal?",
      answer: "Create a sustainable project that self-runs, is privacy-first, helpful, and focused on helping everyone manage their contacts in an AI-enabled way. No venture capital, no growth hacking—just a useful tool that respects your data and actually works."
    },
    {
      question: "Why usage-based pricing?",
      answer: "I don't want to charge for usage that isn't used. I'm not trying to be VC-backed—I just want to make sure the AI tokens are paid for and I can host Rolomind without going bankrupt. You pay for what you use, nothing more. It's that simple."
    },
    {
      question: "Explain the pricing",
      answer: "We charge a $5/month platform fee that gives you up to 10 free queries, then we charge per query depending on the amount of contacts you have. The more contacts in your search results, the more AI tokens we use, so the cost scales accordingly. This ensures you only pay for the actual AI processing you use."
    },
    {
      question: "Can't OpenAI, Gemini, or Claude do the same?",
      answer: (
        <div className="space-y-4">
          <p>Yes, they could do some of it in theory, but here's what makes Rolomind different:</p>
          <ul className="space-y-3 ml-6">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Contact-focused:</strong> While AI chatbots are generalists, Rolomind is built exclusively for contact management. Every feature is optimized for finding and organizing people.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Private & local-first:</strong> Your contacts never leave your browser. Big tech companies can't promise that—their business model depends on your data.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Real workflows:</strong> Edit contacts, bulk operations, CSV imports/exports, LinkedIn integration—actual tools for managing contacts, not just chat.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Open source:</strong> You can audit the code, contribute features, or run your own instance. Try asking ChatGPT for their source code.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>No lock-in:</strong> Export everything anytime. Your contacts are yours, stored in your browser's database, not trapped in a chat history.</span>
            </li>
          </ul>
          <p className="mt-4">Think of it this way: You wouldn't use ChatGPT as your CRM, right? Rolomind is purpose-built for one thing—managing contacts intelligently while respecting your privacy.</p>
        </div>
      )
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="text-center max-w-5xl mx-auto">
          {/* Animated Logo */}
          <div className="mb-4">
            <h1 className="display-text text-primary inline-block text-5xl md:text-7xl">
              Rolomind
            </h1>
          </div>
          
          <p className="text-xl md:text-3xl font-semibold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your AI-Powered Contact Intelligence
          </p>
          <p className="text-base md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Search contacts with natural language. Import from anywhere. 
            Keep everything private and organized in one place.
          </p>

          {/* Mock Video - Moved Up */}
          <div className="relative max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-primary/5 border mb-8">
            <div className="aspect-video flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
                <p className="text-base font-medium">See Rolomind in Action</p>
                <p className="text-sm text-muted-foreground">2 minute demo</p>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Button size="lg" asChild className="text-base md:text-lg px-6 md:px-8 shadow-lg">
                <Link href="/dashboard/app">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Go to App
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="text-base md:text-lg px-6 md:px-8 shadow-lg">
                  <Link href="/sign-up">
                    Start Using Rolomind
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base md:text-lg px-6 md:px-8">
                  <Link href="#pricing">View Pricing</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* How It Works - With Interactive Demos */}
      <div className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">
                Simple, Yet Powerful
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Get started in seconds, find anyone in milliseconds
              </p>
            </div>

            <DemoProvider>
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-xl md:text-2xl font-bold text-primary">
                      1
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Import Your Contacts</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Upload CSV files or import from your favorite platforms
                    </p>
                  </div>
                  <DemoWrapper title="Try Import" demoId="import">
                    <DemoImport />
                  </DemoWrapper>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-xl md:text-2xl font-bold text-primary">
                      2
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Search & Get Insights</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Ask questions in plain English and get AI summaries
                    </p>
                  </div>
                  <DemoWrapper title="Try Search" demoId="search">
                    <div className="space-y-4">
                      <DemoSearch />
                      <DemoResults />
                    </div>
                  </DemoWrapper>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-xl md:text-2xl font-bold text-primary">
                      3
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Enrich with Voice</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Update contact details naturally by speaking
                    </p>
                  </div>
                  <DemoWrapper title="Try Voice">
                    <DemoVoiceEdit />
                  </DemoWrapper>
                </div>
              </div>
            </DemoProvider>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-12 md:py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              Our Values
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on principles that put you first
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <div className="bg-background rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Privacy-First</h3>
              <p className="text-sm text-muted-foreground text-center">
                Your contacts never leave your browser. No cloud sync, no tracking.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Fair Pricing</h3>
              <p className="text-sm text-muted-foreground text-center">
                Pay only for AI queries, not for storage or basic features.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Real AI Use Case</h3>
              <p className="text-sm text-muted-foreground text-center">
                Unlike unhelpful chatbots, this AI actually helps you find and manage contacts.
              </p>
            </div>

            <div className="bg-background rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Open Source</h3>
              <p className="text-sm text-muted-foreground text-center">
                AGPL licensed. Audit the code, contribute features, or self-host.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Self-Host vs Hosted Section */}
      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">
                Choose Your Path
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                Self-host for ultimate control or use our managed service
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-background rounded-2xl p-6 md:p-8 border relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                    Advanced Users
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <Server className="h-8 w-8 text-primary" />
                  <h3 className="text-xl md:text-2xl font-bold">Self-Hosted</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Complete Control</p>
                      <p className="text-sm text-muted-foreground">Your infrastructure, your rules</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">No Usage Limits</p>
                      <p className="text-sm text-muted-foreground">Unlimited searches with your API keys</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Technical Expertise Required</p>
                      <p className="text-sm text-muted-foreground">Requires database setup, SSL certificates, and maintenance</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>⚠️ Not for beginners:</strong> You'll need to manage servers, 
                    databases, SSL certificates, and handle updates yourself.
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="https://github.com/agamm/rolomind#self-hosting">
                      View Installation Guide
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 md:p-8 border-2 border-primary relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <Cloud className="h-8 w-8 text-primary" />
                  <h3 className="text-xl md:text-2xl font-bold">Rolomind.com</h3>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Works Instantly</p>
                      <p className="text-sm text-muted-foreground">No setup, no servers, just sign in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Always Updated</p>
                      <p className="text-sm text-muted-foreground">Latest features without lifting a finger</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Fair Pricing</p>
                      <p className="text-sm text-muted-foreground">Only usage-based, not trying to profit off you</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Perfect for:</strong> Anyone who wants to focus on finding contacts, 
                    not managing infrastructure.
                  </p>
                  <Button asChild className="w-full" size="lg">
                    <Link href="/sign-up">
                      Start Now
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source Section */}
      <div className="bg-gradient-to-b from-muted/50 to-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <GithubIcon className="h-5 w-5" />
              <span className="font-semibold">Open Source</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
              Transparent by Design
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-12">
              Rolomind is open source under AGPL. Review the code, contribute features, 
              or purchase a commercial license for proprietary use.
            </p>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-background rounded-xl p-6 border">
                <Lock className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h4 className="font-semibold mb-2">Privacy Verified</h4>
                <p className="text-sm text-muted-foreground">
                  Audit the code yourself to ensure your data stays private
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 border">
                <Database className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h4 className="font-semibold mb-2">Local-First</h4>
                <p className="text-sm text-muted-foreground">
                  Contacts stored in your browser's IndexedDB
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 border">
                <Globe className="h-8 w-8 text-primary mb-3 mx-auto" />
                <h4 className="font-semibold mb-2">Export to CSV</h4>
                <p className="text-sm text-muted-foreground">
                  Export all your contacts anytime, own your data forever
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-12 md:py-16" id="pricing">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">Simple, Usage-Based Pricing</span>
            </div>
            
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
              Pay for What You Use
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-12">
              No subscriptions or hidden fees. Just transparent usage-based pricing.
            </p>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              <div className="bg-background rounded-2xl p-6 md:p-8 border">
                <h3 className="text-xl md:text-2xl font-bold mb-4">Self-Hosted</h3>
                <p className="text-3xl md:text-4xl font-bold mb-2">$0</p>
                <p className="text-muted-foreground mb-6 md:mb-8">Use your own API keys</p>
                
                <ul className="text-left space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">All features included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Unlimited contacts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Unlimited AI searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Commercial license available</span>
                  </li>
                </ul>

                <Button variant="outline" asChild className="w-full">
                  <Link href="https://github.com/agamm/rolomind">
                    View on GitHub
                  </Link>
                </Button>
              </div>
              
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 md:p-8 border-2 border-primary relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold mb-4">Hosted on Rolomind.com</h3>
                <div className="mb-6 md:mb-8">
                  <p className="text-3xl md:text-4xl font-bold mb-2">$0.02</p>
                  <p className="text-muted-foreground">per AI search</p>
                  <p className="text-sm text-muted-foreground mt-2">+ $5/month platform fee</p>
                </div>
                
                <ul className="text-left space-y-3 mb-6 md:mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">No setup required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Automatic updates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm md:text-base">Cancel anytime</span>
                  </li>
                </ul>

                <Button asChild className="w-full" size="lg">
                  <Link href="/sign-up">
                    Start Now
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  First 100 searches included
                </p>
              </div>
            </div>

            <div className="mt-8 md:mt-12 p-6 bg-muted/50 rounded-xl max-w-2xl mx-auto">
              <h4 className="font-semibold mb-2">Why this pricing?</h4>
              <p className="text-sm text-muted-foreground">
                We only charge for AI-powered searches. Browsing, filtering, and managing 
                your contacts is always free. The $0.02 covers our AI costs plus a small 
                margin. The $5/month keeps our servers running and support available.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Hopefully it could help me pay for tacos here and there—I've been freelancing 
                for the past 3 years, so using Rolomind is also a real help. 🌮
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 md:py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                The story behind Rolomind and why it exists
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-background rounded-xl border overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="text-base md:text-lg font-semibold">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 md:px-6 pb-4 md:pb-6">
                      <div className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-12 md:py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">
            Ready to Find Anyone, Instantly?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands using Rolomind to manage contacts intelligently and privately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base md:text-lg px-6 md:px-8 shadow-lg">
              <Link href="/sign-up">
                Start Using Rolomind
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base md:text-lg px-6 md:px-8">
              <Link href="https://github.com/agamm/rolomind">
                View Source Code
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/sign-in" className="hover:text-foreground">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Developers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="https://github.com/agamm/rolomind" className="hover:text-foreground flex items-center gap-1">
                    <GithubIcon className="h-4 w-4" />
                    GitHub
                  </Link>
                </li>
                <li><Link href="https://github.com/agamm/rolomind#api" className="hover:text-foreground">API Docs</Link></li>
                <li><Link href="https://github.com/agamm/rolomind#self-hosting" className="hover:text-foreground">Self-Host Guide</Link></li>
                <li><Link href="https://github.com/agamm/rolomind#commercial-license" className="hover:text-foreground">Commercial License</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="https://github.com/agamm/rolomind/wiki" className="hover:text-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/agamm/rolomind/issues" className="hover:text-foreground">Report Issue</Link>
                </li>
                <li>
                  <Link href="https://discord.gg/rolomind" className="hover:text-foreground flex items-center gap-1">
                    <HeadphonesIcon className="h-4 w-4" />
                    Discord Community
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="https://github.com/agamm/rolomind/blob/main/LICENSE" className="hover:text-foreground">AGPL License</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-6 md:pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2024 Rolomind. Open source under AGPL License with commercial licensing available.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}