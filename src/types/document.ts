/**
 * Type contracts for the future document/file upload pipeline
 * (src/features/documents). Parsing and extraction are NOT implemented in
 * the scaffold phase; see PROJECT_ROADMAP.md "Document-processing plan".
 */

export type SupportedDocumentType = "pdf" | "txt" | "docx" | "md";

export type DocumentProcessingStatus =
  | "uploaded"
  | "extracting"
  | "chunking"
  | "ready"
  | "failed";

export const MAX_DOCUMENT_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

export interface UploadedDocument {
  id: string;
  workspaceId: string;
  projectId?: string;
  fileName: string;
  fileType: SupportedDocumentType;
  fileSizeBytes: number;
  status: DocumentProcessingStatus;
  /** Populated once extraction succeeds; not implemented yet */
  extractedText?: string;
  /** Populated once chunking succeeds; not implemented yet */
  chunks?: DocumentChunk[];
  errorMessage?: string;
  uploadedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  order: number;
  text: string;
  /** Relevance score assigned during future content-selection step */
  relevanceScore?: number;
}
