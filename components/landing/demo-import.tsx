"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUp, CheckCircle } from "lucide-react";
import { useDemo } from "./demo-context";

const csvSources = [
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Google", color: "#4285F4" },
  { name: "Other", color: "#6B7280" },
];

export function DemoImport() {
  const { activeDemo } = useDemo();
  const [isImporting, setIsImporting] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    // Reset if demo is deactivated
    if (activeDemo !== "import" && activeDemo !== null) {
      setIsImporting(false);
      setIsComplete(false);
    }
  }, [activeDemo]);

  const handleImport = () => {
    setIsImporting(true);
    setIsComplete(false);
    
    setTimeout(() => {
      setIsImporting(false);
      setIsComplete(true);
      
      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    }, 2000);
  };

  return (
    <Card className="p-6 bg-background/50 backdrop-blur border-muted">
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
        {!isImporting && !isComplete && (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileUp className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Works with any CSV format
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {csvSources.map((source) => (
                <span
                  key={source.name}
                  className="text-xs px-2 py-1 rounded-full border"
                  style={{
                    borderColor: source.color,
                    color: source.color,
                    backgroundColor: `${source.color}10`,
                  }}
                >
                  {source.name}
                </span>
              ))}
            </div>
            <Button 
              onClick={handleImport} 
              size="sm"
              className={`transition-all hover:scale-105 active:scale-95 ${
                !isImporting && !isComplete ? "animate-bounce" : ""
              }`}
            >
              Import CSV
            </Button>
          </>
        )}
        
        {isImporting && (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <FileUp className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <p className="text-sm text-muted-foreground">AI normalizing data...</p>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-[2000ms] ease-in-out" 
                style={{ width: isImporting ? '100%' : '0%' }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-detecting columns and formats
            </p>
          </>
        )}
        
        {isComplete && (
          <>
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-medium">250 contacts imported!</p>
            <p className="text-xs text-muted-foreground text-center">
              AI normalized data from mixed formats
            </p>
          </>
        )}
      </div>
    </Card>
  );
}