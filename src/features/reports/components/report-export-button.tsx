"use client";

import * as React from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import type { Workflow } from "@/types/workflow";
import type { Project } from "@/types/workspace";
import type { ScheduleResult } from "@/features/scheduler";
import type { DFA } from "@/features/dfa";

interface ReportExportButtonProps {
  workflow: Workflow;
  project: Project;
  schedule: ScheduleResult | null;
  dfa: DFA | null;
}

export function ReportExportButton({ workflow, project, schedule, dfa }: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let y = 20;
      
      const addText = (text: string, size = 12, isBold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        // Wrap text to fit page width (190)
        const lines = doc.splitTextToSize(text, 170);
        
        // Check if we need a new page
        if (y + (lines.length * 7) > 280) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(lines, 20, y);
        y += lines.length * 7 + (size > 12 ? 5 : 2);
      };

      // Title
      addText(`Workflow Report: ${workflow.name}`, 18, true);
      addText(`Project: ${project.name}`, 14);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      y += 10;

      // Project Context
      addText("Project Context", 14, true);
      addText(project.description);
      y += 5;

      // Workflow Details
      addText("Workflow Details", 14, true);
      addText(`Domain: ${workflow.domain}`);
      addText(`Total Tasks: ${workflow.tasks.length}`);
      y += 5;

      // Schedule Summary
      if (schedule) {
        addText("Schedule Summary", 14, true);
        addText(`Total Duration: ${schedule.totalDurationMinutes} minutes`);
        addText(`Critical Path Tasks: ${schedule.criticalPathTaskIds.length}`);
        if (schedule.issues.length > 0) {
          addText("Schedule Warnings:", 12, true);
          schedule.issues.forEach(iss => addText(`- ${iss}`, 10));
        }
        y += 5;
      }

      // DFA Summary
      if (dfa) {
        addText("Execution DFA (State Machine)", 14, true);
        addText(`Total States: ${dfa.states.length}`);
        addText(`Transitions: ${dfa.transitions.length}`);
        addText(`Accept States: ${dfa.acceptStateIds.length}`);
        y += 5;
      }

      // Tasks List
      addText("Task Breakdown", 14, true);
      workflow.tasks.forEach((task, i) => {
        addText(`${i + 1}. [${task.id}] ${task.name}`, 12, true);
        addText(`Duration: ${task.estimatedDuration}m | Assigned: ${task.assignedMemberId || 'Unassigned'}`);
        addText(`Description: ${task.description}`);
        if (task.dependsOn.length > 0) {
          addText(`Depends on: ${task.dependsOn.join(", ")}`);
        }
        y += 5;
      });

      doc.save(`${workflow.name.replace(/\s+/g, "_")}_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm" className="gap-2">
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      Export PDF
    </Button>
  );
}
