import { db } from "./database";
import type { Workspace, Project } from "@/types/workspace";
import type { Member } from "@/types/member";
import type { Workflow } from "@/types/workflow";
import type { Task } from "@/types/task";
import type { User } from "@/types/auth";

const DEMO_WORKSPACE_ID = "demo-workspace-1";
const DEMO_PROJECT_ID = "demo-project-1";
const DEMO_WORKFLOW_ID = "demo-workflow-1";

/**
 * Ensures the demo data exists in IndexedDB. Always upserts the demo
 * workspace/project/workflow records by fixed IDs so the home page link
 * is always valid, regardless of what other data exists.
 */
export async function seedDemoData() {
  const now = new Date().toISOString();

  // Upsert demo user
  const existingUser = await db.users.get("demo-user-1");
  if (!existingUser) {
    const demoUser: User = {
      id: "demo-user-1",
      name: "Jayadeep",
      email: "jayadeep@flowforge.dev",
      createdAt: now,
      lastLoginAt: now,
    };
    await db.users.put(demoUser);
    localStorage.setItem("flowforge_user_id", "demo-user-1");
  }

  // Upsert demo workspace
  const existingWs = await db.workspaces.get(DEMO_WORKSPACE_ID);
  if (!existingWs) {
    const sampleWorkspace: Workspace = {
      id: DEMO_WORKSPACE_ID,
      name: "Engineering & AI Lab",
      description: "Primary workspace for compiler workflows and engineering projects.",
      createdAt: now,
      updatedAt: now,
    };
    await db.workspaces.put(sampleWorkspace);
  }

  // Upsert demo members
  const existingM1 = await db.members.get("member-demo-1");
  if (!existingM1) {
    const members: Member[] = [
      {
        id: "member-demo-1",
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Jayadeep",
        role: "Lead Architect",
        specialties: ["System Architecture", "Compiler Design"],
        skills: ["Compiler Theory", "TypeScript", "React", "State Machines"],
        experience: "Architected FlowForge compiler pipeline.",
        availability: {
          workingHours: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
          unavailableDates: [],
          capacityFraction: 1.0,
        },
        workload: 0.2,
        preferredTaskTypes: ["Architecture", "State Machines"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "member-demo-2",
        workspaceId: DEMO_WORKSPACE_ID,
        name: "Alex Rivera",
        role: "Senior AI Engineer",
        specialties: ["LLMs", "Graph Theory"],
        skills: ["LLMs", "Python", "DAG Scheduling"],
        experience: "Specialized in LLM prompt generation and DAG topologies.",
        availability: {
          workingHours: [{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }],
          unavailableDates: [],
          capacityFraction: 1.0,
        },
        workload: 0.1,
        preferredTaskTypes: ["AI Compilation"],
        createdAt: now,
        updatedAt: now,
      },
    ];
    await db.members.bulkPut(members);
  }

  // Upsert demo project
  const existingProj = await db.projects.get(DEMO_PROJECT_ID);
  if (!existingProj) {
    const sampleProject: Project = {
      id: DEMO_PROJECT_ID,
      workspaceId: DEMO_WORKSPACE_ID,
      name: "FlowForge Core Engine v1",
      description: "Building the universal AI workflow compiler and state machine simulator.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.put(sampleProject);
  }

  // Always upsert the demo workflow so the link is always valid
  const tasks: Task[] = [
    {
      id: "task-d1",
      workflowId: DEMO_WORKFLOW_ID,
      name: "Parse User Prompt Requirements",
      description: "Extract objectives, constraints, and dependencies from prompt input.",
      status: "completed",
      priority: "high",
      classification: "mandatory",
      estimatedDuration: 60,
      requiredSkills: ["Compiler Theory"],
      assignedMemberId: "member-demo-1",
      dependsOn: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-d2",
      workflowId: DEMO_WORKFLOW_ID,
      name: "Generate Schema & DAG Topology",
      description: "Construct raw workflow nodes and validate schema safety.",
      status: "in_progress",
      priority: "high",
      classification: "mandatory",
      estimatedDuration: 120,
      requiredSkills: ["LLMs", "DAG Scheduling"],
      assignedMemberId: "member-demo-2",
      dependsOn: ["task-d1"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-d3",
      workflowId: DEMO_WORKFLOW_ID,
      name: "Build Formal DFA State Machine",
      description: "Generate 5-tuple (Q, Σ, δ, q0, F) automaton for execution simulation.",
      status: "ready",
      priority: "critical",
      classification: "mandatory",
      estimatedDuration: 90,
      requiredSkills: ["State Machines"],
      assignedMemberId: "member-demo-1",
      dependsOn: ["task-d2"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "task-d4",
      workflowId: DEMO_WORKFLOW_ID,
      name: "Export PDF Architecture Report",
      description: "Assemble Gantt schedule and export presentation report.",
      status: "not_started",
      priority: "medium",
      classification: "optional",
      estimatedDuration: 45,
      requiredSkills: ["TypeScript"],
      assignedMemberId: "member-demo-1",
      dependsOn: ["task-d3"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const sampleWorkflow: Workflow = {
    id: DEMO_WORKFLOW_ID,
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: DEMO_PROJECT_ID,
    name: "AI Compiler Pipeline Workflow",
    description: "End-to-end processing pipeline from natural language prompt to validated DFA state machine.",
    domain: "software_development",
    objective: "Compile natural language inputs into structured execution DAGs.",
    tasks,
    dependencies: [
      { id: "dep-d1", workflowId: DEMO_WORKFLOW_ID, sourceTaskId: "task-d1", targetTaskId: "task-d2", dependencyType: "finish_to_start" },
      { id: "dep-d2", workflowId: DEMO_WORKFLOW_ID, sourceTaskId: "task-d2", targetTaskId: "task-d3", dependencyType: "finish_to_start" },
      { id: "dep-d3", workflowId: DEMO_WORKFLOW_ID, sourceTaskId: "task-d3", targetTaskId: "task-d4", dependencyType: "finish_to_start" },
    ],
    milestones: [
      { id: "ms-d1", workflowId: DEMO_WORKFLOW_ID, name: "DFA Verified", targetDate: now, taskIds: ["task-d3"] }
    ],
    assignments: [],
    constraints: [],
    risks: [],
    metadata: {
      createdBy: "Jayadeep",
      version: 1,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Always put (upsert) so demo workflow is always accessible
  await db.workflows.put(sampleWorkflow);

  return {
    workspaceId: DEMO_WORKSPACE_ID,
    projectId: DEMO_PROJECT_ID,
    workflowId: DEMO_WORKFLOW_ID,
  };
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
