import type { Workflow } from "@/types/workflow";

export interface WorkflowComplexityMetrics {
  nodesCount: number;
  edgesCount: number;
  cyclomaticComplexity: number;
  maxConcurrency: number;
  bottleneckTaskIds: string[];
  healthScore: number;
  rating: "Optimal" | "Moderate" | "Complex";
  recommendations: string[];
}

export function calculateWorkflowComplexity(workflow: Workflow): WorkflowComplexityMetrics {
  const nodesCount = workflow.tasks.length;
  const edgesCount = workflow.dependencies.length;
  
  // McCabe Cyclomatic Complexity for a directed graph: E - V + 2P (assuming P=1)
  const cyclomaticComplexity = Math.max(1, edgesCount - nodesCount + 2);

  // Identify bottleneck tasks (tasks that have >= 2 dependent children)
  const dependentCountMap = new Map<string, number>();
  for (const dep of workflow.dependencies) {
    const current = dependentCountMap.get(dep.sourceTaskId) || 0;
    dependentCountMap.set(dep.sourceTaskId, current + 1);
  }

  const bottleneckTaskIds = Array.from(dependentCountMap.entries())
    .filter(([_, count]) => count >= 2)
    .map(([taskId]) => taskId);

  // Calculate Max Concurrency: tasks with zero dependencies
  const inDegreeMap = new Map<string, number>();
  for (const t of workflow.tasks) {
    inDegreeMap.set(t.id, t.dependsOn?.length || 0);
  }

  let maxConcurrency = 0;
  for (const count of inDegreeMap.values()) {
    if (count === 0) maxConcurrency++;
  }
  maxConcurrency = Math.max(1, maxConcurrency);

  // Health Score: Base 100 minus complexity penalties
  let penalty = (cyclomaticComplexity - 1) * 5 + bottleneckTaskIds.length * 8;
  if (nodesCount === 0) penalty = 0;
  const healthScore = Math.max(20, Math.min(100, 100 - penalty));

  let rating: "Optimal" | "Moderate" | "Complex" = "Optimal";
  if (healthScore < 60) {
    rating = "Complex";
  } else if (healthScore < 85) {
    rating = "Moderate";
  }

  const recommendations: string[] = [];
  if (cyclomaticComplexity > 10) {
    recommendations.push("High cyclomatic complexity. Consider splitting into sub-workflows.");
  }
  if (bottleneckTaskIds.length > 0) {
    recommendations.push(`${bottleneckTaskIds.length} bottleneck task(s) blocking multiple downstream steps.`);
  }
  if (maxConcurrency > 5) {
    recommendations.push("High task concurrency depth; monitor resource allocations.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Workflow structure is highly optimized with clean execution paths.");
  }

  return {
    nodesCount,
    edgesCount,
    cyclomaticComplexity,
    maxConcurrency,
    bottleneckTaskIds,
    healthScore,
    rating,
    recommendations,
  };
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
