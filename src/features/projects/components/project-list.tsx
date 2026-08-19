"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Calendar, ArrowRight, Edit, Trash2, Clock, CheckCircle2, Archive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Project, ProjectStatus } from "@/types/workspace";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>;
    case "completed":
      return <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</Badge>;
    case "archived":
      return <Badge variant="outline" className="text-muted-foreground"><Archive className="w-3 h-3 mr-1"/> Archived</Badge>;
    case "draft":
    default:
      return <Badge variant="secondary" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1"/> Draft</Badge>;
  }
}

function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const workflowCount = useLiveQuery(
    () => db.workflows.where("projectId").equals(project.id).count(),
    [project.id]
  );

  const formattedDate = React.useMemo(() => {
    try {
      return new Date(project.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return project.createdAt;
    }
  }, [project.createdAt]);

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-secondary p-2 text-secondary-foreground mt-0.5">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              <div className="mt-1.5">
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(project)}
              title="Edit Project"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(project)}
              title="Delete Project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-3 text-sm">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="py-2 text-xs text-muted-foreground flex items-center justify-between border-t border-b bg-muted/20 my-2 px-6">
        <div className="flex items-center gap-1.5 py-2">
          <FolderGit2 className="h-3.5 w-3.5" />
          <span>{workflowCount ?? 0} {workflowCount === 1 ? "workflow" : "workflows"}</span>
        </div>
        <div className="flex items-center gap-1.5 py-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formattedDate}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 gap-2">
        <Link href={`/workspace/${project.workspaceId}/projects/${project.id}`} className="w-full">
          <Button variant="default" className="w-full justify-between group">
            <span>Open Project</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onCreateNew: () => void;
}

export function ProjectList({ projects, onEdit, onDelete, onCreateNew }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="rounded-full bg-secondary p-4 text-secondary-foreground mb-4">
          <FolderGit2 className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">No projects yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Projects organize your workflow generations by objective. Create your first project to get started.
        </p>
        <Button className="mt-6" onClick={onCreateNew}>
          Create Project
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((proj) => (
        <ProjectCard
          key={proj.id}
          project={proj}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
