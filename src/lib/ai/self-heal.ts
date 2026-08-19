import type { Workflow } from "@/types/workflow";
import type { Dependency } from "@/types/task";

export interface SelfHealResult {
  repairedWorkflow: Workflow;
  fixedIssuesCount: number;
  logs: string[];
}

/**
 * Pure, deterministic algorithm to self-heal workflow graph structural errors
 * (e.g. self-dependencies, circular dependencies, orphan dependency pointers).
 */
export function selfHealWorkflow(workflow: Workflow): SelfHealResult {
  const logs: string[] = [];
  let fixedCount = 0;

  const validTaskIds = new Set(workflow.tasks.map((t) => t.id));

  // 1. Remove dependencies pointing to non-existent tasks or self
  const cleanedDependencies: Dependency[] = [];
  for (const dep of workflow.dependencies) {
    if (!validTaskIds.has(dep.sourceTaskId) || !validTaskIds.has(dep.targetTaskId)) {
      logs.push(`Removed orphan dependency link [${dep.id}] pointing to missing tasks.`);
      fixedCount++;
      continue;
    }
    if (dep.sourceTaskId === dep.targetTaskId) {
      logs.push(`Removed self-referential dependency loop on task [${dep.sourceTaskId}].`);
      fixedCount++;
      continue;
    }
    cleanedDependencies.push(dep);
  }

  // 2. Break direct circular dependencies (A -> B and B -> A)
  const edgeSet = new Set(cleanedDependencies.map((d) => `${d.sourceTaskId}->${d.targetTaskId}`));
  const finalDependencies: Dependency[] = [];

  for (const dep of cleanedDependencies) {
    const reverseKey = `${dep.targetTaskId}->${dep.sourceTaskId}`;
    if (edgeSet.has(reverseKey)) {
      // Keep only one direction
      edgeSet.delete(`${dep.sourceTaskId}->${dep.targetTaskId}`);
      logs.push(`Broke cycle between tasks [${dep.sourceTaskId}] and [${dep.targetTaskId}].`);
      fixedCount++;
    } else {
      finalDependencies.push(dep);
    }
  }

  // 3. Update task dependsOn arrays to reflect final dependencies
  const updatedTasks = workflow.tasks.map((task) => {
    const validPrereqs = finalDependencies
      .filter((d) => d.targetTaskId === task.id)
      .map((d) => d.sourceTaskId);

    return {
      ...task,
      dependsOn: Array.from(new Set(validPrereqs)),
      updatedAt: new Date().toISOString(),
    };
  });

  const repairedWorkflow: Workflow = {
    ...workflow,
    tasks: updatedTasks,
    dependencies: finalDependencies,
    updatedAt: new Date().toISOString(),
  };

  return {
    repairedWorkflow,
    fixedIssuesCount: fixedCount,
    logs,
  };
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
