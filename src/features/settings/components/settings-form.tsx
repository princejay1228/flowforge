"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save } from "lucide-react";
import { useSettings, type AIProviderName } from "@/hooks/use-settings";

export function SettingsForm() {
  const { settings, isLoaded, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isLoaded) {
      // eslint-disable-next-line
      setLocalSettings(settings);
    }
  }, [settings, isLoaded]);

  if (!isLoaded) return <div className="py-8 text-center text-sm text-muted-foreground">Loading settings...</div>;

  const handleSave = () => {
    setIsSaving(true);
    updateSettings(localSettings);
    setTimeout(() => setIsSaving(false), 500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle>AI Provider Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure which AI model to use for workflow generation and provide your API keys. Keys are stored safely in your browser&apos;s local storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Primary AI Provider</label>
            <select
              className="flex h-10 w-full md:w-[300px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={localSettings.aiProvider}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, aiProvider: e.target.value as AIProviderName }))}
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="openai">OpenAI (Not yet implemented)</option>
            </select>
            <p className="text-[13px] text-muted-foreground mt-1">
              Select the engine used to convert text descriptions into structured workflows.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Google Gemini Config</h3>
            <div className="space-y-1.5 max-w-lg">
              <label className="text-sm font-medium leading-none">Gemini API Key</label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={localSettings.geminiApiKey}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
              />
              <p className="text-[13px] text-muted-foreground">
                Get your free API key from Google AI Studio. This key never leaves your browser except when sending prompts to Google.
              </p>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t opacity-50 pointer-events-none">
            <h3 className="text-sm font-semibold text-muted-foreground">OpenAI Config (Coming Soon)</h3>
            <div className="space-y-1.5 max-w-lg">
              <label className="text-sm font-medium leading-none">OpenAI API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={localSettings.openaiApiKey}
                disabled
              />
            </div>
          </div>
          
          <div className="pt-4 border-t flex items-center justify-start gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Saved!" : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
