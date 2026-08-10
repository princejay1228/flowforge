/**
 * Architectural contracts for the future Deterministic Finite Automaton
 * (DFA) / formal-language engine (src/features/dfa).
 *
 * IMPORTANT: These are type contracts only. The mathematical implementation
 * (state generation, transition validation, minimization, simulation) is a
 * future development phase and must be implemented correctly, not faked.
 * See DEVELOPMENT_RULES.md: "Keep DFA logic mathematically correct."
 */

export type DFAStateId = string;
export type DFASymbol = string;

export interface DFAState {
  id: DFAStateId;
  label: string;
  /** Optional link back to the workflow Task this state represents */
  relatedTaskId?: string;
  isAccepting: boolean;
  isDead: boolean;
}

export interface DFATransition {
  from: DFAStateId;
  symbol: DFASymbol;
  to: DFAStateId;
}

/**
 * Formal 5-tuple definition of a DFA: (Q, Σ, δ, q0, F)
 */
export interface DFADefinition {
  id: string;
  workflowId: string;
  /** Q: finite set of states */
  states: DFAState[];
  /** Σ: finite alphabet (task/event identifiers) */
  alphabet: DFASymbol[];
  /** δ: transition function, represented as an explicit list */
  transitions: DFATransition[];
  /** q0: start state */
  startState: DFAStateId;
  /** F: accepting states */
  acceptingStates: DFAStateId[];
  /** Explicit dead/trap state, if modeled */
  deadState?: DFAStateId;
  generatedAt: string;
}

export interface DFARuntimeState {
  dfaId: string;
  /** Current state during simulation/execution */
  currentState: DFAStateId;
  /** Symbols consumed so far, in order */
  history: DFASymbol[];
}

export interface DFATransitionResult {
  accepted: boolean;
  nextState: DFAStateId;
  isValidTransition: boolean;
  reason?: string;
}
