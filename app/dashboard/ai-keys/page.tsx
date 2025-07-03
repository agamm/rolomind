"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, ExternalLink, Eye, EyeOff, Save, ChevronDown, ChevronRight } from "lucide-react";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { toast } from "sonner";

interface ApiKeys {
  openrouterApiKey?: string;
  openaiApiKey?: string;
}

export default function AIKeysPage() {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openrouter: false,
    openai: false
  });
  const [instructionsCollapsed, setInstructionsCollapsed] = useState({
    openrouter: true,
    openai: true
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/ai-keys');
      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/ai-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys)
      });

      if (response.ok) {
        toast.success('API keys saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save API keys');
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      </div>
    );
  }

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
            <BreadcrumbPage>AI Keys</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI API Keys</h1>
          <p className="text-muted-foreground mt-2">
            Configure your AI service API keys for Rolomind features
          </p>
        </div>

        {/* OpenRouter API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenRouter API Key
              <span className="text-sm font-normal text-destructive">Required</span>
            </CardTitle>
            <CardDescription>
              Used for AI-powered contact search, merging, and processing features.
              <Link 
                href="https://openrouter.ai/" 
                target="_blank" 
                className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
              >
                Get your key from OpenRouter <ExternalLink className="h-3 w-3" />
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openrouter-key">API Key</Label>
              <div className="relative">
                <Input
                  id="openrouter-key"
                  type={showKeys.openrouter ? "text" : "password"}
                  placeholder="sk-or-v1-..."
                  value={keys.openrouterApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, openrouterApiKey: e.target.value })}
                  onFocus={() => setShowKeys({ ...showKeys, openrouter: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowKeys({ ...showKeys, openrouter: !showKeys.openrouter })}
                >
                  {showKeys.openrouter ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => setInstructionsCollapsed(prev => ({ ...prev, openrouter: !prev.openrouter }))}
              >
                <div className="flex items-center gap-1">
                  {instructionsCollapsed.openrouter ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <strong>Setup instructions</strong>
                </div>
              </Button>
              {!instructionsCollapsed.openrouter && (
                <div className="ml-4 mt-2 space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Visit <Link href="https://openrouter.ai/" target="_blank" className="text-primary hover:underline">openrouter.ai</Link></li>
                    <li>Sign up or log in to your account</li>
                    <li>Navigate to the &quot;API Keys&quot; section</li>
                    <li>Create a new API key</li>
                    <li>Copy and paste it above</li>
                  </ol>
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                    💡 <strong>Recommended:</strong> Set a credit limit for your API key to control spending.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OpenAI API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenAI API Key
              <span className="text-sm font-normal text-muted-foreground">Optional</span>
            </CardTitle>
            <CardDescription>
              Used for voice transcription features. Required only if you plan to use voice notes.
              <Link 
                href="https://platform.openai.com/settings/organization/api-keys" 
                target="_blank" 
                className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
              >
                Get your key from OpenAI <ExternalLink className="h-3 w-3" />
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">API Key</Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showKeys.openai ? "text" : "password"}
                  placeholder="sk-..."
                  value={keys.openaiApiKey || ''}
                  onChange={(e) => setKeys({ ...keys, openaiApiKey: e.target.value })}
                  onFocus={() => setShowKeys({ ...showKeys, openai: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                >
                  {showKeys.openai ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                onClick={() => setInstructionsCollapsed(prev => ({ ...prev, openai: !prev.openai }))}
              >
                <div className="flex items-center gap-1">
                  {instructionsCollapsed.openai ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <strong>Setup instructions</strong>
                </div>
              </Button>
              {!instructionsCollapsed.openai && (
                <div className="ml-4 mt-2 space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Visit <Link href="https://platform.openai.com/settings/organization/api-keys" target="_blank" className="text-primary hover:underline">OpenAI API Keys</Link></li>
                    <li>Sign up or log in to your account</li>
                    <li>Navigate to the &quot;API Keys&quot; section</li>
                    <li>Create a new API key</li>
                    <li>Copy and paste it above</li>
                  </ol>
                  <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                    💡 <strong>Recommended:</strong> Set <Link href="https://platform.openai.com/settings/organization/limits" target="_blank" className="text-primary hover:underline">usage limits</Link> to control spending.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save API Keys'}
          </Button>
        </div>
      </div>
    </>
  );
}