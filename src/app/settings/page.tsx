"use client";

import * as React from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SettingsForm } from "@/features/settings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link href="/workspace">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground pl-0">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Workspaces</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Application Settings</h1>
            <p className="text-muted-foreground">
              Configure FlowForge preferences, AI models, and local browser storage.
            </p>
          </div>
        </div>

        <SettingsForm />
      </main>
    </div>
  );
}
