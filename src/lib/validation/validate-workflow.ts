import type { Workflow } from "@/types/workflow";
import type { ValidationResult, ValidationIssue } from "@/types/validation";
import { workflowSchema } from "@/schemas/workflow.schema";

/**
 * Entry point for the deterministic Validation Engine
 * (src/features/validation). This is the boundary between AI output and
 * the rest of the application — see ARCHITECTURE.md.
 *
 * Currently performs schema validation only. The deeper checks (circular
 * dependencies, skill mismatches, overloaded members, impossible
 * schedules, etc. — see PROJECT_ROADMAP.md "Validation engine") are a
 * future development phase and are NOT implemented here.
 */
export function validateWorkflowSchema(candidate: unknown): ValidationResult {
  const result = workflowSchema.safeParse(candidate);

  if (result.success) {
    return { valid: true, issues: [] };
  }

  return {
    valid: false,
    issues: result.error.issues.map((issue) => ({
      code: "missing_required_field",
      severity: "error",
      message: issue.message,
      path: issue.path.join("."),
    })),
  };
}

import type { Member } from "@/types/member";

/**
 * Deterministic validation pass checking semantics (circular deps, skill mismatches, etc.)
 */
export function validateWorkflowSemantics(workflow: Workflow, members: Member[] = []): ValidationResult {
  const issues: ValidationIssue[] = [];
  const taskIds = new Set<string>();

  // 1. Duplicate Task IDs
  for (const task of workflow.tasks) {
    if (taskIds.has(task.id)) {
      issues.push({
        code: "duplicate_task_id",
        severity: "error",
        message: `Task ID "${task.id}" is duplicated.`,
        path: `tasks[id=${task.id}]`,
      });
    }
    taskIds.add(task.id);
  }

  // 2. Unresolved Dependencies
  const adjList = new Map<string, string[]>();
  for (const task of workflow.tasks) {
    adjList.set(task.id, []);
  }

  for (const dep of workflow.dependencies) {
    if (!taskIds.has(dep.sourceTaskId)) {
      issues.push({
        code: "missing_dependency",
        severity: "error",
        message: `Dependency source task "${dep.sourceTaskId}" does not exist.`,
        path: `dependencies[id=${dep.id}]`,
      });
    }
    if (!taskIds.has(dep.targetTaskId)) {
      issues.push({
        code: "missing_dependency",
        severity: "error",
        message: `Dependency target task "${dep.targetTaskId}" does not exist.`,
        path: `dependencies[id=${dep.id}]`,
      });
    }
    
    if (taskIds.has(dep.sourceTaskId) && taskIds.has(dep.targetTaskId)) {
      adjList.get(dep.sourceTaskId)!.push(dep.targetTaskId);
    }
  }

  // Check dependsOn array in tasks too
  for (const task of workflow.tasks) {
    if (task.dependsOn) {
      for (const depId of task.dependsOn) {
        if (!taskIds.has(depId)) {
          issues.push({
            code: "missing_dependency",
            severity: "error",
            message: `Task "${task.id}" depends on non-existent task "${depId}".`,
            path: `tasks[id=${task.id}].dependsOn`,
          });
        } else {
          // Add to adjList for cycle detection (dependsOn means depId -> task.id)
          adjList.get(depId)!.push(task.id);
        }
      }
    }
  }

  // 3. Circular Dependencies (DFS)
  const visited = new Set<string>();
  const stack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (const neighbor of adjList.get(node) || []) {
      if (hasCycle(neighbor)) {
        issues.push({
          code: "circular_dependency",
          severity: "error",
          message: `Circular dependency detected involving task "${node}" and "${neighbor}".`,
        });
        return true;
      }
    }

    stack.delete(node);
    return false;
  }

  for (const taskId of taskIds) {
    if (!visited.has(taskId)) {
      hasCycle(taskId);
    }
  }

  // 4. Member checks
  const membersById = new Map<string, Member>(members.map(m => [m.id, m]));

  for (const task of workflow.tasks) {
    if (task.assignedMemberId) {
      const member = membersById.get(task.assignedMemberId);
      if (!member) {
        issues.push({
          code: "invalid_member_reference",
          severity: "error",
          message: `Task "${task.name}" is assigned to a non-existent member ID "${task.assignedMemberId}".`,
          path: `tasks[id=${task.id}].assignedMemberId`,
        });
      } else {
        // 5. Skill Match
        const missingSkills = task.requiredSkills.filter(s => !member.skills.includes(s));
        if (missingSkills.length > 0) {
          issues.push({
            code: "skill_mismatch",
            severity: "warning",
            message: `Member "${member.name}" is missing required skills for task "${task.name}": ${missingSkills.join(", ")}`,
            path: `tasks[id=${task.id}].assignedMemberId`,
            relatedId: member.id,
          });
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
