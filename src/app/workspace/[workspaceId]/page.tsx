"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FolderGit2, ArrowRight, Layers, ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useMembers } from "@/hooks/use-members";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { members, isLoading: membersLoading } = useMembers(workspaceId);

  if (wsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading workspace details...
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Workspace Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The workspace you are trying to view does not exist or was deleted.
          </p>
          <Button onClick={() => router.push("/workspace")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Workspaces</span>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader workspaceId={workspace.id} workspaceName={workspace.name} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Workspace Header */}
        <div className="border-b pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <Link href="/workspace">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground pl-0">
                <ArrowLeft className="h-4 w-4" />
                <span>Workspaces</span>
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground max-w-2xl">{workspace.description}</p>
          )}
        </div>

        {/* Dashboard Quick Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Members Card */}
          <Card className="flex flex-col justify-between hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Team Members</CardTitle>
                  <CardDescription>
                    {membersLoading ? "Loading..." : `${members.length} registered ${members.length === 1 ? "member" : "members"}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage member roles, skills, availability schedules, and capacity constraints for workflow assignments.
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Link href={`/workspace/${workspace.id}/members`} className="w-full">
                <Button className="w-full justify-between group">
                  <span>Manage Team Members</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Projects Card */}
          <Card className="flex flex-col justify-between hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-secondary p-2.5 text-secondary-foreground">
                  <FolderGit2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Projects</CardTitle>
                  <CardDescription>Workflow generation scopes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create and group workflow compilation projects within this workspace.
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Link href={`/workspace/${workspace.id}/projects`} className="w-full">
                <Button variant="default" className="w-full justify-between group">
                  <span>View Projects</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Compiler Readiness Card */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Compiler Readiness</CardTitle>
                  <CardDescription>Phase 1 Active</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Workspace & Member IndexedDB storage active. Ready to supply team skills context to the AI workflow compiler.
            </CardContent>
            <CardFooter className="pt-4 border-t text-xs text-muted-foreground">
              Local persistence: IndexedDB (Dexie)
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
