"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import type { Workflow } from "@/types/workflow";
import type { Project } from "@/types/workspace";
import type { Member } from "@/types/member";
import type { ScheduleResult } from "@/features/scheduler";
import type { DFA } from "@/features/dfa";
import { generateWorkflowPdfReport } from "../lib/generate-workflow-pdf";

export interface ReportExportButtonProps {
  workflow: Workflow;
  project: Project;
  members?: Member[];
  schedule?: ScheduleResult | null;
  dfa?: DFA | null;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function ReportExportButton({
  workflow,
  project,
  members = [],
  schedule = null,
  dfa = null,
  variant = "outline",
  size = "sm",
  className = "gap-2",
  label = "Export PDF Report",
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const doc = generateWorkflowPdfReport({
        workflow,
        project,
        members,
        schedule,
        dfa,
      });

      const sanitizedName = workflow.name
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/_+/g, "_");
      doc.save(`${sanitizedName}_Audit_Report.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      <span>{isExporting ? "Generating PDF..." : label}</span>
    </Button>
  );
}

