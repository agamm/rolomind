"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Search, Sparkles } from "lucide-react";
import { useDemo } from "./demo-context";

const searchExamples = [
  "CEOs in Texas",
  "engineers who know Python", 
  "marketing experts in NYC",
  "founders I met last year",
  "investors in fintech"
];

export function DemoSearch() {
  const { setCurrentSearch, setIsSearching, activeDemo } = useDemo();
  const [localSearch, setLocalSearch] = React.useState("");
  const [searchIndex, setSearchIndex] = React.useState(0);
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    // Reset if demo is deactivated
    if (activeDemo !== "search" && activeDemo !== null) {
      setLocalSearch("");
      setIsTyping(false);
      setCurrentSearch("");
      setIsSearching(false);
      return;
    }

    // Only run if this demo is active
    if (activeDemo !== "search") {
      return;
    }
    const example = searchExamples[searchIndex];
    let charIndex = 0;
    
    setIsTyping(true);
    setLocalSearch("");
    
    const typeInterval = setInterval(() => {
      if (charIndex < example.length) {
        setLocalSearch(example.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // Trigger search when typing completes
        setTimeout(() => {
          setCurrentSearch(example);
          setIsSearching(true);
          
          // Reset after showing results - pause for 4s to show contacts
          setTimeout(() => {
            setIsSearching(false);
            // Wait a bit more before starting next search
            setTimeout(() => {
              setSearchIndex((prev) => (prev + 1) % searchExamples.length);
            }, 2000);
          }, 6000);
        }, 500);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [searchIndex, setCurrentSearch, setIsSearching, activeDemo]);

  return (
    <Card className="p-6 bg-background/50 backdrop-blur border-muted">
      <div className="space-y-4">
        <div className="relative">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm">{localSearch}</span>
              {isTyping && <span className="animate-pulse">|</span>}
            </div>
            {!isTyping && localSearch && (
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            )}
          </div>
        </div>
        
      </div>
    </Card>
  );
}