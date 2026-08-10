export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}
