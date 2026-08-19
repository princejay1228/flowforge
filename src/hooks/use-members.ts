"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { memberSchema } from "@/schemas/member.schema";
import type { Member } from "@/types/member";

export type CreateMemberPayload = Omit<Member, "id" | "createdAt" | "updatedAt">;
export type UpdateMemberPayload = Partial<Omit<Member, "id" | "workspaceId" | "createdAt" | "updatedAt">>;

export function useMembers(workspaceId: string) {
  const members = useLiveQuery(
    () => (workspaceId ? db.members.where("workspaceId").equals(workspaceId).toArray() : []),
    [workspaceId]
  );

  const createMember = async (
    payload: CreateMemberPayload
  ): Promise<{ success: boolean; member?: Member; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const candidate: Member = {
        ...payload,
        id: crypto.randomUUID(),
        workspaceId,
        createdAt: now,
        updatedAt: now,
      };

      const result = memberSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0];
        const errorPath = firstError.path.join(".");
        const errorMsg = `${errorPath ? errorPath + ": " : ""}${firstError.message}`;
        return { success: false, error: errorMsg };
      }

      await db.members.put(result.data);
      return { success: true, member: result.data };
    } catch (err) {
      console.error("Failed to create member:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const updateMember = async (
    id: string,
    payload: UpdateMemberPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = await db.members.get(id);
      if (!existing) {
        return { success: false, error: "Member not found" };
      }

      const candidate: Member = {
        ...existing,
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      const result = memberSchema.safeParse(candidate);
      if (!result.success) {
        const firstError = result.error.issues[0];
        const errorPath = firstError.path.join(".");
        const errorMsg = `${errorPath ? errorPath + ": " : ""}${firstError.message}`;
        return { success: false, error: errorMsg };
      }

      await db.members.put(result.data);
      return { success: true };
    } catch (err) {
      console.error("Failed to update member:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  const deleteMember = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.members.delete(id);
      return { success: true };
    } catch (err) {
      console.error("Failed to delete member:", err);
      return { success: false, error: err instanceof Error ? err.message : "Database error" };
    }
  };

  return {
    members: members ?? [],
    isLoading: members === undefined,
    createMember,
    updateMember,
    deleteMember,
  };
}
