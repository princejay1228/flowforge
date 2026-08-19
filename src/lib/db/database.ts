import Dexie, { type EntityTable } from "dexie";
import type { Workspace, Project } from "@/types/workspace";
import type { Member } from "@/types/member";
import type { Workflow } from "@/types/workflow";
import type { UploadedDocument } from "@/types/document";
import type { User } from "@/types/auth";

/**
 * FlowForge's client-side database, backed by IndexedDB via Dexie.js.
 * This is the ONLY place application data is persisted — there is no
 * backend/server database (see DEVELOPMENT_RULES.md: "Do not introduce a
 * backend database").
 *
 * Tables are declared here with their primary key + indexed fields.
 * Complex nested objects (tasks, dependencies, schedule, etc.) are stored
 * inline on the `Workflow` record rather than normalized into separate
 * tables, since they are always read/written together with the workflow.
 */
export class FlowForgeDatabase extends Dexie {
  workspaces!: EntityTable<Workspace, "id">;
  projects!: EntityTable<Project, "id">;
  members!: EntityTable<Member, "id">;
  workflows!: EntityTable<Workflow, "id">;
  documents!: EntityTable<UploadedDocument, "id">;
  users!: EntityTable<User, "id">;

  constructor() {
    super("flowforge");

    this.version(1).stores({
      workspaces: "id, name, createdAt",
      projects: "id, workspaceId, status, createdAt",
      members: "id, workspaceId, name",
      workflows: "id, workspaceId, projectId, domain, createdAt",
      documents: "id, workspaceId, projectId, status, uploadedAt",
    });

    this.version(2).stores({
      users: "id, email",
    });
  }
}

/**
 * Singleton database instance. Import this rather than constructing a new
 * `FlowForgeDatabase` elsewhere.
 */
export const db = new FlowForgeDatabase();
