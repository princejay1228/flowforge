"use client";

import * as React from "react";
import { useDocuments } from "@/hooks/use-documents";
import { Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentListProps {
  workspaceId: string;
  projectId?: string;
}

export function DocumentList({ workspaceId, projectId }: DocumentListProps) {
  const { documents, isLoading, deleteDocument } = useDocuments(workspaceId, projectId);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteDocument(id);
    setDeletingId(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return <div className="text-sm text-muted-foreground">No documents uploaded.</div>;
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary/10 p-2 rounded text-primary shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-sm truncate" title={doc.fileName}>{doc.fileName}</div>
              <div className="text-[10px] text-muted-foreground flex gap-2">
                <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                <span>{doc.chunks?.length || 0} chunks</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => handleDelete(doc.id)}
            disabled={deletingId === doc.id}
          >
            {deletingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      ))}
    </div>
  );
}
