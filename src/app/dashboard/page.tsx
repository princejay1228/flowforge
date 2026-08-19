"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Briefcase, Folder, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const workspaces = useLiveQuery(() => db.workspaces.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());

  const activeProjects = projects?.filter(p => p.status === "active") || [];
  
  // Sort projects by deadline
  const upcomingDeadlines = (projects || [])
    .filter(p => p.deadline && p.status !== "completed" && p.status !== "archived")
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  if (!workspaces || !projects) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to FlowForge. Here&apos;s a summary of your operations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Projects needing attention soon</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No upcoming deadlines.
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingDeadlines.map(project => (
                    <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <Link href={`/workspace/${project.workspaceId}/projects/${project.id}`} className="font-medium hover:underline block">
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] capitalize">{project.status}</Badge>
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(project.deadline!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Workspaces</CardTitle>
              <CardDescription>Quick access to active environments</CardDescription>
            </CardHeader>
            <CardContent>
              {workspaces.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  You haven&apos;t created any workspaces yet.
                  <div className="mt-4">
                    <Link href="/workspace">
                      <Button variant="outline" size="sm">Create Workspace</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaces.map(ws => (
                    <Link key={ws.id} href={`/workspace/${ws.id}/projects`} className="block">
                      <div className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <Briefcase className="h-5 w-5 mr-3 text-primary" />
                        <div>
                          <div className="font-medium">{ws.name}</div>
                          <div className="text-xs text-muted-foreground">{ws.description || "No description"}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
