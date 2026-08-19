import type { Workflow } from "@/types/workflow";

export interface DFAState {
  id: string;
  name: string;
  isAccept: boolean;
  isStart: boolean;
  isDead: boolean;
  completedTaskIds: string[];
}

export interface DFATransition {
  fromStateId: string;
  toStateId: string;
  symbol: string; // usually an event like 'COMPLETE_TASK_1'
}

export interface DFA {
  states: DFAState[];
  transitions: DFATransition[];
  alphabet: string[];
  startStateId: string;
  acceptStateIds: string[];
}

/**
 * Builds a deterministic finite automaton (DFA) representing all valid execution
 * paths of a workflow. Each state represents a unique combination of completed tasks.
 *
 * NOTE: For large workflows, the number of states can grow exponentially (state explosion).
 * This implementation builds the reachable states dynamically to avoid generating impossible states.
 */
export function buildWorkflowDFA(workflow: Workflow): DFA {
  const alphabet = workflow.tasks.map(t => `COMPLETE_${t.id}`);
  const allTaskIds = new Set(workflow.tasks.map(t => t.id));

  // adjacency list for dependencies (dependsOn -> task)
  const requiredBy = new Map<string, string[]>();
  // adjacency list for prerequisite (task -> dependsOn)
  const prerequisites = new Map<string, string[]>();

  for (const t of workflow.tasks) {
    requiredBy.set(t.id, []);
    prerequisites.set(t.id, [...t.dependsOn]);
  }
  for (const dep of workflow.dependencies) {
    if (requiredBy.has(dep.sourceTaskId) && requiredBy.has(dep.targetTaskId)) {
      requiredBy.get(dep.sourceTaskId)!.push(dep.targetTaskId);
      if (!prerequisites.get(dep.targetTaskId)!.includes(dep.sourceTaskId)) {
        prerequisites.get(dep.targetTaskId)!.push(dep.sourceTaskId);
      }
    }
  }

  const states: DFAState[] = [];
  const transitions: DFATransition[] = [];
  
  const stateMap = new Map<string, DFAState>();

  // state ID is basically sorted completed tasks joined by ','
  const getStateId = (completed: string[]) => {
    if (completed.length === 0) return "START";
    return [...completed].sort().join(",");
  };

  const createState = (completed: string[]): DFAState => {
    const id = getStateId(completed);
    if (stateMap.has(id)) return stateMap.get(id)!;

    const isStart = completed.length === 0;
    const isAccept = completed.length === allTaskIds.size;
    const isDead = false; // Dead states are added if a failure happens, but skipping for basic DFA

    const state: DFAState = {
      id,
      name: isStart ? "Start" : isAccept ? "Accept" : `Done: ${completed.length}/${allTaskIds.size}`,
      isStart,
      isAccept,
      isDead,
      completedTaskIds: [...completed],
    };
    
    states.push(state);
    stateMap.set(id, state);
    return state;
  };

  const startState = createState([]);
  const queue = [startState];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (processed.has(current.id)) continue;
    processed.add(current.id);

    // Find all tasks that can be executed from current state
    const completedSet = new Set(current.completedTaskIds);
    
    for (const task of workflow.tasks) {
      if (!completedSet.has(task.id)) {
        // check if all prerequisites are met
        const prereqs = prerequisites.get(task.id) || [];
        const canExecute = prereqs.every(req => completedSet.has(req));

        if (canExecute) {
          const nextCompleted = [...current.completedTaskIds, task.id];
          const nextState = createState(nextCompleted);
          
          transitions.push({
            fromStateId: current.id,
            toStateId: nextState.id,
            symbol: `COMPLETE_${task.id}`,
          });

          if (!processed.has(nextState.id)) {
            queue.push(nextState);
          }
        }
      }
    }
  }

  // Find unreachable tasks
  const acceptStates = states.filter(s => s.isAccept);
  if (acceptStates.length === 0) {
    // If we can't reach accept state, there's a problem (likely a circular dependency or disconnected graph)
    // We can mark a Dead state here if needed
  }

  return {
    states,
    transitions,
    alphabet,
    startStateId: startState.id,
    acceptStateIds: acceptStates.map(s => s.id),
  };
}
