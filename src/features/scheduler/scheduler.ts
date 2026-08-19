import type { Workflow } from "@/types/workflow";
import type { Member } from "@/types/member";

export interface ScheduledTask {
  taskId: string;
  earliestStartMinutes: number;
  earliestFinishMinutes: number;
  isCriticalPath: boolean;
}

export interface ScheduleResult {
  scheduledTasks: ScheduledTask[];
  totalDurationMinutes: number;
  criticalPathTaskIds: string[];
  issues: string[];
}

export function scheduleWorkflow(workflow: Workflow, members: Member[] = []): ScheduleResult {
  const issues: string[] = [];
  const taskMap = new Map(workflow.tasks.map(t => [t.id, t]));
  
  // 1. Build adjacency list and in-degree map for topological sort
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const t of workflow.tasks) {
    adjList.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  // Dependencies can be from workflow.dependencies OR task.dependsOn
  for (const dep of workflow.dependencies) {
    if (adjList.has(dep.sourceTaskId) && adjList.has(dep.targetTaskId)) {
      adjList.get(dep.sourceTaskId)!.push(dep.targetTaskId);
      inDegree.set(dep.targetTaskId, inDegree.get(dep.targetTaskId)! + 1);
    }
  }

  for (const task of workflow.tasks) {
    for (const depId of task.dependsOn) {
      if (adjList.has(depId) && adjList.has(task.id)) {
        // Prevent double counting if both dependency structures have it
        if (!adjList.get(depId)!.includes(task.id)) {
          adjList.get(depId)!.push(task.id);
          inDegree.set(task.id, inDegree.get(task.id)! + 1);
        }
      }
    }
  }

  // 2. Topological Sort (Kahn's Algorithm)
  const queue: string[] = [];
  for (const [taskId, deg] of Array.from(inDegree.entries())) {
    if (deg === 0) queue.push(taskId);
  }

  const sortedTasks: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedTasks.push(current);
    for (const neighbor of adjList.get(current)!) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sortedTasks.length !== workflow.tasks.length) {
    issues.push("Cannot schedule: Circular dependency detected in workflow.");
    return {
      scheduledTasks: [],
      totalDurationMinutes: 0,
      criticalPathTaskIds: [],
      issues,
    };
  }

  // 3. Compute Earliest Start/Finish Times
  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();
  
  for (const taskId of sortedTasks) {
    earliestStart.set(taskId, 0);
  }

  let projectDuration = 0;

  for (const taskId of sortedTasks) {
    const task = taskMap.get(taskId)!;
    const est = earliestStart.get(taskId)!;
    const eſt = est + task.estimatedDuration;
    earliestFinish.set(taskId, eſt);

    if (eſt > projectDuration) {
      projectDuration = eſt;
    }

    for (const neighbor of adjList.get(taskId)!) {
      const neighborEst = earliestStart.get(neighbor)!;
      if (eſt > neighborEst) {
        earliestStart.set(neighbor, eſt);
      }
    }
  }

  // 4. Compute Latest Start/Finish Times for Critical Path
  const latestFinish = new Map<string, number>();
  const latestStart = new Map<string, number>();

  for (const taskId of sortedTasks) {
    latestFinish.set(taskId, projectDuration);
  }

  for (let i = sortedTasks.length - 1; i >= 0; i--) {
    const taskId = sortedTasks[i];
    const task = taskMap.get(taskId)!;
    const lft = latestFinish.get(taskId)!;
    const lst = lft - task.estimatedDuration;
    latestStart.set(taskId, lst);

    for (const [node, neighbors] of Array.from(adjList.entries())) {
      if (neighbors.includes(taskId)) {
        const currentLft = latestFinish.get(node)!;
        if (lst < currentLft) {
          latestFinish.set(node, lst);
        }
      }
    }
  }

  // 5. Build Result and identify Critical Path
  const criticalPathTaskIds: string[] = [];
  const scheduledTasks: ScheduledTask[] = [];

  for (const taskId of sortedTasks) {
    const est = earliestStart.get(taskId)!;
    const lst = latestStart.get(taskId)!;
    const isCritical = est === lst;
    
    if (isCritical) {
      criticalPathTaskIds.push(taskId);
    }

    scheduledTasks.push({
      taskId,
      earliestStartMinutes: est,
      earliestFinishMinutes: earliestFinish.get(taskId)!,
      isCriticalPath: isCritical,
    });
  }

  // 6. Basic Member Capacity/Availability Warning
  // Very simplistic check: If total task hours for a member > capacity fraction of a standard week (e.g. 40 hours)
  const memberWorkload = new Map<string, number>();
  for (const task of workflow.tasks) {
    if (task.assignedMemberId) {
      memberWorkload.set(
        task.assignedMemberId, 
        (memberWorkload.get(task.assignedMemberId) || 0) + task.estimatedDuration
      );
    }
  }

  const membersById = new Map(members.map(m => [m.id, m]));
  for (const [memberId, durationMinutes] of Array.from(memberWorkload.entries())) {
    const m = membersById.get(memberId);
    if (m) {
      const maxWeeklyMinutes = 40 * 60 * m.availability.capacityFraction;
      if (durationMinutes > maxWeeklyMinutes) {
        issues.push(`Member ${m.name} is overloaded (assigned ${Math.round(durationMinutes/60)}h > capacity ${Math.round(maxWeeklyMinutes/60)}h).`);
      }
    }
  }

  return {
    scheduledTasks,
    totalDurationMinutes: projectDuration,
    criticalPathTaskIds,
    issues,
  };
}
