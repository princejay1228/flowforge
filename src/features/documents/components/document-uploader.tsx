"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";

interface DocumentUploaderProps {
  workspaceId: string;
  projectId?: string;
}

export function DocumentUploader({ workspaceId, projectId }: DocumentUploaderProps) {
  const { uploadFile } = useDocuments(workspaceId, projectId);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const result = await uploadFile(file, projectId);
    
    if (!result.success) {
      setError(result.error || "Upload failed");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md"
        className="hidden"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        variant="outline"
        size="sm"
        className="gap-2 w-fit"
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        Upload Document
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[10px] text-muted-foreground">Supported: .txt, .md (Max 3MB)</p>
    </div>
  );
}
