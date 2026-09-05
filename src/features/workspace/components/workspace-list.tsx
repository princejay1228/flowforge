"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Users, ArrowRight, Edit, Trash2, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Workspace } from "@/types/workspace";

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
}

function WorkspaceCard({ workspace, onEdit, onDelete }: WorkspaceCardProps) {
  // Query member count for this workspace
  const memberCount = useLiveQuery(
    () => db.members.where("workspaceId").equals(workspace.id).count(),
    [workspace.id]
  );

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(workspace.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return workspace.createdAt;
    }
  }, [workspace.createdAt]);

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{workspace.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(workspace)}
              title="Edit Workspace"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(workspace)}
              title="Delete Workspace"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {workspace.description ? (
          <CardDescription className="line-clamp-2 mt-1">
            {workspace.description}
          </CardDescription>
        ) : (
          <CardDescription className="italic mt-1 text-xs">
            No description provided.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="py-2 text-xs text-muted-foreground flex items-center justify-between border-t border-b bg-muted/20 my-2 px-6">
        <div className="flex items-center gap-1.5 py-2">
          <Users className="h-3.5 w-3.5" />
          <span>{memberCount ?? 0} team {memberCount === 1 ? "member" : "members"}</span>
        </div>
        <div className="flex items-center gap-1.5 py-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formattedDate}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        <Link href={`/workspace/${workspace.id}`} className="w-full">
          <Button variant="default" className="w-full justify-between group">
            <span>Open Workspace</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

interface WorkspaceListProps {
  workspaces: Workspace[];
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onCreateNew: () => void;
}

export function WorkspaceList({ workspaces, onEdit, onDelete, onCreateNew }: WorkspaceListProps) {
  if (workspaces.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
          <FolderGit2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">No workspaces yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Get started by creating your first workspace to organize team members and compilation projects.
        </p>
        <div className="flex gap-3 mt-6">
          <Button onClick={onCreateNew}>
            Create Workspace
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const { seedDemoData } = await import("@/lib/db/seed");
              await seedDemoData();
            }}
          >
            Load Sample Data
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
