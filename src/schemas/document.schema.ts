import { z } from "zod";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/types/document";

export const supportedDocumentTypeSchema = z.enum(["pdf", "txt", "docx", "md"]);

export const documentProcessingStatusSchema = z.enum([
  "uploaded",
  "extracting",
  "chunking",
  "ready",
  "failed",
]);

export const documentChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  order: z.number().int().nonnegative(),
  text: z.string(),
  relevanceScore: z.number().min(0).max(1).optional(),
});

export const uploadedDocumentSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string().optional(),
  fileName: z.string().min(1),
  fileType: supportedDocumentTypeSchema,
  fileSizeBytes: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
  status: documentProcessingStatusSchema,
  extractedText: z.string().optional(),
  chunks: z.array(documentChunkSchema).optional(),
  errorMessage: z.string().optional(),
  uploadedAt: z.string(),
});

export type UploadedDocumentInput = z.infer<typeof uploadedDocumentSchema>;
