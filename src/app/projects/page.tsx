"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, ArrowRight, Plus } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function GlobalProjectsPage() {
  const router = useRouter();
  const workspaces = useLiveQuery(() => db.workspaces.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());

  const isLoading = !workspaces || !projects;

  // If only 1 workspace exists, auto redirect to that workspace's projects
  React.useEffect(() => {
    if (!isLoading && workspaces.length === 1) {
      router.replace(`/workspace/${workspaces[0].id}/projects`);
    }
  }, [isLoading, workspaces, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading projects...
        </div>
      </div>
    );
  }

  const workspaceMap = new Map(workspaces.map((w) => [w.id, w]));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-primary" />
              <span>All Projects</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cross-workspace compilation projects and pipelines.
            </p>
          </div>
          <Link href="/workspace">
            <Button variant="outline" className="gap-2">
              <span>Manage Workspaces</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Projects Found</CardTitle>
              <CardDescription>
                Create a workspace first to start organizing projects and workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workspace">
                <Button>Go to Workspaces</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => {
              const ws = workspaceMap.get(proj.workspaceId);
              return (
                <Link
                  key={proj.id}
                  href={`/workspace/${proj.workspaceId}/projects/${proj.id}`}
                  className="block group"
                >
                  <Card className="h-full hover:border-primary/50 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {proj.status}
                        </Badge>
                        {ws && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                            {ws.name}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors mt-2">
                        {proj.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs">
                        {proj.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground flex items-center justify-between">
                      <span>Updated {new Date(proj.updatedAt).toLocaleDateString()}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
