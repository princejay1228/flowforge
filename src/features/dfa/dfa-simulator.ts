import { DFA, DFAState } from "./dfa-builder";

export class DFASimulator {
  private dfa: DFA;
  private currentStateId: string;
  private stateMap: Map<string, DFAState>;

  constructor(dfa: DFA) {
    this.dfa = dfa;
    this.currentStateId = dfa.startStateId;
    this.stateMap = new Map(dfa.states.map(s => [s.id, s]));
  }

  getCurrentState(): DFAState {
    return this.stateMap.get(this.currentStateId)!;
  }

  getAvailableTransitions(): string[] {
    return this.dfa.transitions
      .filter(t => t.fromStateId === this.currentStateId)
      .map(t => t.symbol);
  }

  canTransition(symbol: string): boolean {
    return this.dfa.transitions.some(
      t => t.fromStateId === this.currentStateId && t.symbol === symbol
    );
  }

  transition(symbol: string): boolean {
    const nextTransition = this.dfa.transitions.find(
      t => t.fromStateId === this.currentStateId && t.symbol === symbol
    );

    if (nextTransition) {
      this.currentStateId = nextTransition.toStateId;
      return true;
    }
    return false;
  }

  isAccept(): boolean {
    return this.dfa.acceptStateIds.includes(this.currentStateId);
  }
}
