import type { Workflow } from "@/types/workflow";
import type { Dependency } from "@/types/task";
import type { Member } from "@/types/member";

export interface SelfHealResult {
  repairedWorkflow: Workflow;
  fixedIssuesCount: number;
  logs: string[];
}

/**
 * Pure, deterministic algorithm to self-heal workflow graph structural errors
 * (e.g. self-dependencies, circular dependencies, orphan dependency pointers)
 * and harmonize member assignments & skill mismatches.
 */
export function selfHealWorkflow(workflow: Workflow, members: Member[] = []): SelfHealResult {
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

  // 4. Resolve member assignments & skill mismatches
  const membersById = new Map<string, Member>(members.map((m) => [m.id, m]));
  const normalizeSkill = (sk: string) => sk.toLowerCase().replace(/[_\s-]+/g, "");

  const finalTasks = updatedTasks.map((task) => {
    const modifiedTask = { ...task };

    // If assigned to a non-existent member
    if (modifiedTask.assignedMemberId && !membersById.has(modifiedTask.assignedMemberId)) {
      if (members.length > 0) {
        modifiedTask.assignedMemberId = members[0].id;
        logs.push(`Reassigned task "${task.name}" from missing ID to "${members[0].name}".`);
        fixedCount++;
      } else {
        delete modifiedTask.assignedMemberId;
        logs.push(`Removed invalid assignee reference on task "${task.name}".`);
        fixedCount++;
      }
    }

    // If member is assigned, check skills
    if (modifiedTask.assignedMemberId && membersById.has(modifiedTask.assignedMemberId)) {
      const assignedMember = membersById.get(modifiedTask.assignedMemberId)!;
      const memberSkillSet = new Set((assignedMember.skills || []).map(normalizeSkill));

      const missingSkills = (modifiedTask.requiredSkills || []).filter((s) => {
        const norm = normalizeSkill(s);
        return (
          !memberSkillSet.has(norm) &&
          !Array.from(memberSkillSet).some((msk) => norm.includes(msk) || msk.includes(norm))
        );
      });

      if (missingSkills.length > 0) {
        // Option A: Look for another team member who possesses these skills
        const qualifiedMember = members.find((m) => {
          const mSkills = new Set((m.skills || []).map(normalizeSkill));
          return (modifiedTask.requiredSkills || []).every((s) => {
            const norm = normalizeSkill(s);
            return mSkills.has(norm) || Array.from(mSkills).some((msk) => norm.includes(msk) || msk.includes(norm));
          });
        });

        if (qualifiedMember && qualifiedMember.id !== assignedMember.id) {
          modifiedTask.assignedMemberId = qualifiedMember.id;
          logs.push(`Reassigned task "${task.name}" to qualified member "${qualifiedMember.name}".`);
          fixedCount++;
        } else {
          // Option B: Harmonize requiredSkills with assignee's capabilities
          const validSkills = (modifiedTask.requiredSkills || []).filter((s) => !missingSkills.includes(s));
          modifiedTask.requiredSkills = validSkills.length > 0 ? validSkills : (assignedMember.skills && assignedMember.skills.length > 0 ? [...assignedMember.skills] : []);
          logs.push(`Harmonized skill requirements for task "${task.name}" with assignee "${assignedMember.name}".`);
          fixedCount++;
        }
      }
    }

    return modifiedTask;
  });

  const repairedWorkflow: Workflow = {
    ...workflow,
    tasks: finalTasks,
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
