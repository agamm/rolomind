"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Sparkles, Check, User } from "lucide-react";
import { useDemo } from "./demo-context";

export function DemoVoiceEdit() {
  const { activeDemo } = useDemo();
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "Sarah Chen",
    company: "StartupXYZ",
    role: "CEO",
    email: "sarah@email.com"
  });
  const [updatedFields, setUpdatedFields] = React.useState<Set<string>>(new Set());

  const voiceCommands = [
    "Update Sarah's company to TechStart Inc",
    "Change email to sarah.chen@techstart.com",
    "Update role to CEO and Founder",
    "Add phone number 512-555-0123",
  ];

  React.useEffect(() => {
    // Reset if demo is deactivated
    if (activeDemo !== "voice" && activeDemo !== null) {
      setIsRecording(false);
      setTranscript("");
      setIsProcessing(false);
      setUpdatedFields(new Set());
      setFormData({
        name: "Sarah Chen",
        company: "StartupXYZ",
        role: "CEO",
        email: "sarah@email.com"
      });
    }
  }, [activeDemo]);

  const handleVoiceClick = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setTranscript("");
    setUpdatedFields(new Set());
    
    // Simulate voice transcription
    let charIndex = 0;
    const command = voiceCommands[Math.floor(Math.random() * voiceCommands.length)];
    
    const typeInterval = setInterval(() => {
      if (charIndex < command.length) {
        setTranscript(command.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsRecording(false);
        setIsProcessing(true);
        
        // Process the command
        setTimeout(() => {
          setIsProcessing(false);
          
          // Apply updates based on command
          const newUpdatedFields = new Set<string>();
          const newFormData = { ...formData };
          
          if (command.includes("company")) {
            newFormData.company = "TechStart Inc";
            newUpdatedFields.add("company");
          } else if (command.includes("email")) {
            newFormData.email = "sarah.chen@techstart.com";
            newUpdatedFields.add("email");
          } else if (command.includes("role")) {
            newFormData.role = "CEO and Founder";
            newUpdatedFields.add("role");
          }
          
          setFormData(newFormData);
          setUpdatedFields(newUpdatedFields);
          
          // Clear highlights after a delay
          setTimeout(() => {
            setUpdatedFields(new Set());
          }, 3000);
        }, 1000);
      }
    }, 50);
  };

  return (
    <Card className="p-6 bg-background/50 backdrop-blur border-muted">
      <div className="space-y-4">
        {/* Voice Recording Section at Top */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Voice Command</p>
            </div>
            <div className="relative">
              <Button
                onClick={handleVoiceClick}
                size="sm"
                variant={isRecording ? "destructive" : "default"}
                className={`rounded-full h-10 w-10 p-0 transition-all hover:scale-110 active:scale-95 ${
                  !isRecording && !transcript ? "animate-bounce" : ""
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {(transcript || isProcessing) && (
            <div className="text-sm space-y-2">
              {transcript && (
                <p className="italic text-muted-foreground">&ldquo;{transcript}&rdquo;</p>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-3 w-3 animate-pulse text-primary" />
                  <span className="text-xs">AI processing...</span>
                </div>
              )}
            </div>
          )}
          
          {!transcript && !isRecording && (
            <p className="text-xs text-muted-foreground text-center">
              Click the mic to try voice commands
            </p>
          )}
        </div>

        {/* Contact Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Contact Details</p>
          </div>
          
          <div className="grid gap-3">
            <div>
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input
                id="name"
                value={formData.name}
                readOnly
                className={`h-8 text-sm ${
                  updatedFields.has("name") 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800" 
                    : ""
                }`}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="company" className="text-xs">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  readOnly
                  className={`h-8 text-sm ${
                    updatedFields.has("company") 
                      ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800" 
                      : ""
                  }`}
                />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-xs">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  readOnly
                  className={`h-8 text-sm ${
                    updatedFields.has("role") 
                      ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800" 
                      : ""
                  }`}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                value={formData.email}
                readOnly
                className={`h-8 text-sm ${
                  updatedFields.has("email") 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800" 
                    : ""
                }`}
              />
            </div>
          </div>
        </div>

        {updatedFields.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            <span>Fields updated by AI</span>
          </div>
        )}
      </div>
    </Card>
  );
}