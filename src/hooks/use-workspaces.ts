"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

/**
 * Example data-access hook establishing the pattern future hooks should
 * follow: components read data via `useLiveQuery` over the Dexie
 * database, never by importing `db` directly inside a component.
 */
export function useWorkspaces() {
  return useLiveQuery(() => db.workspaces.toArray(), []);
}
