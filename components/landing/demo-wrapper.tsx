"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useDemo } from "./demo-context";

interface DemoWrapperProps {
  children: React.ReactNode;
  title?: string;
  demoId: string;
}

export function DemoWrapper({ children, title, demoId }: DemoWrapperProps) {
  const { activeDemo, setActiveDemo } = useDemo();
  const isPlaying = activeDemo === demoId;

  React.useEffect(() => {
    // Reset when activeDemo changes to something else
    if (activeDemo !== demoId && activeDemo !== null) {
      // This demo is not active anymore
    }
  }, [activeDemo, demoId]);

  const handlePlay = () => {
    setActiveDemo(demoId);
  };

  if (!isPlaying) {
    return (
      <div className="relative rounded-lg overflow-hidden">
        {/* Blurred background preview */}
        <div className="opacity-60 blur-[2px] pointer-events-none">
          {children}
        </div>
        
        {/* Overlay with play button */}
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex flex-col items-center justify-center">
          <Button
            onClick={handlePlay}
            size="icon"
            variant="secondary"
            className="rounded-full h-16 w-16 shadow-lg cursor-pointer hover:scale-110 hover:shadow-xl transition-all"
          >
            <Play className="h-6 w-6 ml-1" />
          </Button>
          <p className="text-sm font-medium mt-3">Click to try</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}