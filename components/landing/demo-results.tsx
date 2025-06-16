"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { User, MapPin, Building, Brain } from "lucide-react";
import { useDemo } from "./demo-context";

const mockContactsBySearch: Record<string, Array<{ name: string; role: string; company: string; location: string }>> = {
  "CEOs in Texas": [
    { name: "Sarah Chen", role: "CEO", company: "TechStart", location: "Austin, TX" },
    { name: "Michael Rodriguez", role: "CEO", company: "DataFlow", location: "Dallas, TX" },
    { name: "Jennifer Park", role: "CEO", company: "CloudAI", location: "Houston, TX" },
  ],
  "engineers who know Python": [
    { name: "Alex Kumar", role: "Senior Engineer", company: "DevCorp", location: "San Francisco, CA" },
    { name: "Maria Silva", role: "ML Engineer", company: "AI Labs", location: "Boston, MA" },
    { name: "James Wilson", role: "Backend Engineer", company: "StartupXYZ", location: "Seattle, WA" },
  ],
  "marketing experts in NYC": [
    { name: "Emma Thompson", role: "CMO", company: "BrandCo", location: "New York, NY" },
    { name: "David Lee", role: "Marketing Director", company: "AdTech Inc", location: "New York, NY" },
    { name: "Sophie Martin", role: "Growth Lead", company: "Fintech App", location: "New York, NY" },
  ],
  "founders I met last year": [
    { name: "Chris Anderson", role: "Founder", company: "InnovateCo", location: "Denver, CO" },
    { name: "Lisa Wang", role: "Co-Founder", company: "HealthTech", location: "Miami, FL" },
    { name: "Ryan O'Brien", role: "Founder & CEO", company: "EdTech Platform", location: "Chicago, IL" },
  ],
  "investors in fintech": [
    { name: "Patricia Johnson", role: "Partner", company: "Venture Capital LLC", location: "Palo Alto, CA" },
    { name: "Robert Kim", role: "Angel Investor", company: "Kim Investments", location: "New York, NY" },
    { name: "Nina Patel", role: "Investment Director", company: "FinVentures", location: "London, UK" },
  ],
};

export function DemoResults() {
  const { currentSearch, isSearching } = useDemo();
  const [showResults, setShowResults] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(false);

  React.useEffect(() => {
    if (isSearching && currentSearch) {
      setShowResults(false);
      setShowSummary(false);
      
      const timer1 = setTimeout(() => setShowResults(true), 1500);
      const timer2 = setTimeout(() => setShowSummary(true), 2500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setShowResults(false);
      setShowSummary(false);
    }
  }, [isSearching, currentSearch]);

  const contacts = currentSearch ? mockContactsBySearch[currentSearch] || [] : [];

  const getSummaryForSearch = (search: string) => {
    const summaries: Record<string, string> = {
      "CEOs in Texas": "Found 3 CEOs in Texas tech companies. All are in major cities with strong startup ecosystems. Consider reaching out to Sarah Chen first - her company is in a similar space.",
      "engineers who know Python": "Identified 3 Python engineers across different specialties. Maria Silva has ML expertise which might be valuable for AI projects.",
      "marketing experts in NYC": "Located 3 senior marketing professionals in NYC. Emma Thompson's CMO experience could provide strategic insights.",
      "founders I met last year": "Retrieved 3 founders from your 2023 connections. Chris Anderson's company has grown significantly since you met.",
      "investors in fintech": "Found 3 fintech investors with different check sizes. Patricia Johnson focuses on Series A rounds."
    };
    return summaries[search] || "Found relevant contacts matching your search criteria.";
  };

  if (!isSearching && !currentSearch) {
    return null;
  }

  return (
    <Card className="p-6 bg-background/50 backdrop-blur border-muted">
      <div className="space-y-4">
        {isSearching && !showResults && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-4 w-32 bg-muted rounded" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-40 bg-muted/70 rounded" />
                    <div className="h-3 w-24 bg-muted/70 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showResults && contacts.length > 0 && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
            <p className="text-xs text-muted-foreground mb-2">Found {contacts.length} matches:</p>
            {contacts.map((contact, i) => (
              <div 
                key={i} 
                className="p-3 bg-muted/30 rounded-lg border border-border space-y-1 animate-in slide-in-from-left duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{contact.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {contact.role} at {contact.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {contact.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showSummary && currentSearch && (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in duration-500">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-medium">AI Summary</p>
                <p className="text-xs text-muted-foreground">
                  {getSummaryForSearch(currentSearch)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}