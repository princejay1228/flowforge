"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { FolderGit2, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Workflow Compiler</span>
      </div>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{APP_NAME}</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        A universal AI-powered workflow compiler and management platform. 
        Transform natural language descriptions into structured, schedulable workflows.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/workspace">
          <Button className="gap-2 shadow-md">
            <FolderGit2 className="h-4 w-4" />
            <span>Get Started / Manage Workspaces</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="mt-10 border-primary/20 bg-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Key Capabilities</CardTitle>
          <CardDescription>
            Your workflow data is securely stored locally in your browser's IndexedDB.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• <strong>AI Compilation:</strong> Use natural language to generate fully validated formal workflows.</p>
          <p>• <strong>DFA Automaton Stepper:</strong> Interactively simulate workflow formal state transitions.</p>
          <p>• <strong>Complexity & Health Gauge:</strong> Analyze McCabe Cyclomatic complexity and bottleneck risks.</p>
          <p>• <strong>Graph Self-Healing:</strong> 1-click AI graph refactoring for circular dependencies.</p>
        </CardContent>
      </Card>
    </main>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
