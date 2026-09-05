"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { seedDemoData } from "@/lib/db";
import { db } from "@/lib/db";
import { FolderGit2, Sparkles, ArrowRight, Play, LayoutDashboard, Cpu, GitGraph, FileText } from "lucide-react";

export default function Home() {
  const [demoIds, setDemoIds] = useState<{ workspaceId: string; projectId: string; workflowId: string } | null>(null);

  useEffect(() => {
    // Auto-seed if database is empty so visitors have immediate rich interactive data
    db.workspaces.count().then((count) => {
      if (count === 0) {
        seedDemoData().then((ids) => setDemoIds(ids));
      } else {
        setDemoIds({
          workspaceId: "demo-workspace-1",
          projectId: "demo-project-1",
          workflowId: "demo-workflow-1",
        });
      }
    });
  }, []);

  const handleSeed = async () => {
    const ids = await seedDemoData();
    setDemoIds(ids);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="mx-auto flex flex-1 max-w-4xl flex-col justify-center px-6 py-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Workflow Compiler & Deterministic Engine
          </span>
        </div>

        <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {APP_NAME}
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          A universal AI-powered workflow compiler and state machine simulator.
          Compile natural language and requirements into deterministic DAG execution pipelines, 
          verify with formal DFAs, and export executive audit reports.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {demoIds ? (
            <Link
              href={`/workspace/${demoIds.workspaceId}/projects/${demoIds.projectId}/workflows/${demoIds.workflowId}`}
            >
              <Button className="gap-2 shadow-md">
                <Play className="h-4 w-4" />
                <span>Launch Interactive Workflow Editor</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button onClick={handleSeed} className="gap-2 shadow-md">
              <Play className="h-4 w-4" />
              <span>Load Sample Compiler Pipeline</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
          </Link>

          <Link href="/workspace">
            <Button variant="outline" className="gap-2">
              <FolderGit2 className="h-4 w-4" />
              <span>Manage Workspaces</span>
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-10">
          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="p-4 pb-2">
              <Sparkles className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-sm font-semibold">AI Workflow Compiler</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Natural language prompt parsing with schema guarantees and validation.
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="p-4 pb-2">
              <GitGraph className="h-5 w-5 text-indigo-500 mb-1" />
              <CardTitle className="text-sm font-semibold">DAG Topological Graph</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Visual dependency graph with Critical Path Method (CPM) and slack calculations.
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="p-4 pb-2">
              <Cpu className="h-5 w-5 text-emerald-500 mb-1" />
              <CardTitle className="text-sm font-semibold">Formal DFA Automaton</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Deterministic finite automaton with interactive step simulator and zero deadlocks.
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-all">
            <CardHeader className="p-4 pb-2">
              <FileText className="h-5 w-5 text-rose-500 mb-1" />
              <CardTitle className="text-sm font-semibold">Audit & PDF Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Formal audit metrics, McCabe complexity score, and 1-click executive PDF export.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
