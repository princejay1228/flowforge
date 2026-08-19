"use client";

import * as React from "react";

export type AIProviderName = "gemini" | "openai";

export interface AppSettings {
  aiProvider: AIProviderName;
  geminiApiKey: string;
  openaiApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: "gemini",
  geminiApiKey: "",
  openaiApiKey: "",
};

export function useSettings() {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("flowforge_settings");
      if (stored) {
        // eslint-disable-next-line
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = React.useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("flowforge_settings", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save settings to localStorage", e);
      }
      return next;
    });
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
  };
}
