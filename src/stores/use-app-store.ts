import { create } from "zustand";

/**
 * Minimal, foundational UI-state store for the currently selected
 * workspace/project context. This is intentionally small during the
 * scaffold phase — it exists to establish the Zustand pattern that future
 * feature stores (e.g. a workflow-editor store, a scheduler store) should
 * follow, not to hold application data (that belongs in IndexedDB via
 * src/lib/db, not in memory-only Zustand state).
 */
interface AppState {
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  setActiveWorkspace: (workspaceId: string | null) => void;
  setActiveProject: (projectId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeWorkspaceId: null,
  activeProjectId: null,
  setActiveWorkspace: (workspaceId) =>
    set({ activeWorkspaceId: workspaceId, activeProjectId: null }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
}));
