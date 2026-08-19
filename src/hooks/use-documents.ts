"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { UploadedDocument, DocumentChunk, MAX_DOCUMENT_SIZE_BYTES } from "@/types/document";

export function useDocuments(workspaceId: string, projectId?: string) {
  const documents = useLiveQuery(
    () => {
      if (!workspaceId) return [];
      let collection = db.documents.where("workspaceId").equals(workspaceId);
      if (projectId) {
        collection = collection.and(doc => doc.projectId === projectId || !doc.projectId);
      }
      return collection.toArray();
    },
    [workspaceId, projectId]
  );

  const uploadFile = async (file: File, pId?: string): Promise<{ success: boolean; error?: string }> => {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return { success: false, error: "File exceeds 3MB limit." };
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "txt" && extension !== "md") {
      return { success: false, error: "Only .txt and .md files are supported for now." };
    }

    try {
      const text = await file.text();
      
      // Simple chunking (e.g., split by double newlines or chunks of 1000 characters)
      const rawChunks = text.split(/\n\n+/);
      const chunks: DocumentChunk[] = rawChunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        documentId: "", // will be set below
        order: index,
        text: chunk.trim(),
      })).filter(c => c.text.length > 0);

      const docId = crypto.randomUUID();
      chunks.forEach(c => c.documentId = docId);

      const newDoc: UploadedDocument = {
        id: docId,
        workspaceId,
        projectId: pId,
        fileName: file.name,
        fileType: extension as "txt" | "md",
        fileSizeBytes: file.size,
        status: "ready",
        extractedText: text,
        chunks,
        uploadedAt: new Date().toISOString()
      };

      await db.documents.add(newDoc);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  };

  const deleteDocument = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.documents.delete(id);
      return { success: true };
    } catch {
      return { success: false, error: "Delete failed" };
    }
  };

  return {
    documents: documents ?? [],
    isLoading: documents === undefined,
    uploadFile,
    deleteDocument,
  };
}
