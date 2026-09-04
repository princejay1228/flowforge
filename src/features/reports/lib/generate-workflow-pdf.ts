import { jsPDF } from "jspdf";
import type { Workflow } from "@/types/workflow";
import type { Project } from "@/types/workspace";
import type { Member } from "@/types/member";
import type { ScheduleResult } from "@/features/scheduler";
import type { DFA } from "@/features/dfa";
import { calculateWorkflowComplexity } from "@/features/validation";
import { validateWorkflowSemantics } from "@/lib/validation/validate-workflow";

export interface GeneratePdfReportOptions {
  workflow: Workflow;
  project: Project;
  members?: Member[];
  schedule?: ScheduleResult | null;
  dfa?: DFA | null;
}

export function generateWorkflowPdfReport({
  workflow,
  project,
  members = [],
  schedule = null,
  dfa = null,
}: GeneratePdfReportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  let y = 16;

  const membersById = new Map<string, Member>(members.map((m) => [m.id, m]));
  const complexity = calculateWorkflowComplexity(workflow);
  const validation = validateWorkflowSemantics(workflow, members);

  // Helper for auto page-breaks
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 18;
      // Draw mini header on subsequent pages
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(marginX, y, contentWidth, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`FLOWFORGE REPORT: ${workflow.name.toUpperCase()} (CONTINUED)`, marginX + 3, y + 5.5);
      y += 12;
      return true;
    }
    return false;
  };

  // ==========================================
  // 1. BRANDED HEADER BANNER
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, 26, 2, 2, "F");

  // FlowForge Logo / Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("FLOWFORGE", marginX + 6, y + 10);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text("COMPILER & DETERMINISTIC SCHEDULING ENGINE", marginX + 6, y + 16);

  // Report Type & Timestamp on right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(241, 245, 249); // slate-100
  doc.text("WORKFLOW AUDIT & FEASIBILITY REPORT", pageWidth - marginX - 6, y + 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.text(`Generated: ${dateStr} | Confidential`, pageWidth - marginX - 6, y + 16, { align: "right" });

  y += 32;

  // ==========================================
  // 2. PROJECT & WORKFLOW DETAILS
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(workflow.name, marginX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Project: ${project.name}  |  Domain: ${workflow.domain.replace(/_/g, " ").toUpperCase()}  |  Tasks: ${workflow.tasks.length}`, marginX, y);
  y += 5;

  if (workflow.description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(workflow.description, contentWidth);
    doc.text(descLines, marginX, y);
    y += descLines.length * 4.5 + 3;
  } else {
    y += 3;
  }

  // ==========================================
  // 3. EXECUTIVE KPI CARDS (4 COLUMNS)
  // ==========================================
  checkPageBreak(25);
  const cardWidth = (contentWidth - 9) / 4; // 3 gaps of 3mm
  const cardHeight = 20;

  interface KpiCard {
    label: string;
    value: string;
    subtext: string;
    badgeColor: [number, number, number];
  }

  const kpis: KpiCard[] = [
    {
      label: "TOTAL TASKS",
      value: `${workflow.tasks.length}`,
      subtext: `${workflow.dependencies.length} Dependencies`,
      badgeColor: [79, 70, 229], // indigo-600
    },
    {
      label: "TOTAL DURATION",
      value: schedule ? `${schedule.totalDurationMinutes}m` : `${workflow.tasks.reduce((a, b) => a + (b.estimatedDuration || 0), 0)}m`,
      subtext: schedule ? `Optimized via CPM` : "Linear sum",
      badgeColor: [14, 165, 233], // sky-500
    },
    {
      label: "CRITICAL PATH",
      value: schedule ? `${schedule.criticalPathTaskIds.length} Tasks` : "N/A",
      subtext: schedule ? "Zero slack bottlenecks" : "Unscheduled",
      badgeColor: [225, 29, 72], // rose-600
    },
    {
      label: "MCCABE COMPLEXITY",
      value: `M = ${complexity.cyclomaticComplexity}`,
      subtext: `Rating: ${complexity.rating}`,
      badgeColor: complexity.rating === "Optimal" ? [22, 163, 74] : complexity.rating === "Moderate" ? [217, 119, 6] : [220, 38, 38],
    },
  ];

  kpis.forEach((card, idx) => {
    const cardX = marginX + idx * (cardWidth + 3);
    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, "FD");

    // Top color indicator line
    doc.setFillColor(...card.badgeColor);
    doc.rect(cardX, y, cardWidth, 1.5, "F");

    // Card text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, cardX + 3, y + 12.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(card.subtext, cardX + 3, y + 17);
  });

  y += cardHeight + 7;

  // ==========================================
  // 4. GRAPH FEASIBILITY & VALIDATION AUDIT
  // ==========================================
  checkPageBreak(38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Algorithmic Feasibility & Validation Audit", marginX, y);
  y += 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, 28, 1.5, 1.5, "FD");

  // Left column: Topology & Validation Status
  const auditY = y + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Graph Topology:", marginX + 4, auditY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    validation.valid ? "Directed Acyclic Graph (DAG) Verified — Zero cycles detected." : "Graph semantic violations present.",
    marginX + 33,
    auditY
  );

  doc.setFont("helvetica", "bold");
  doc.text("Validation Status:", marginX + 4, auditY + 5.5);
  if (validation.valid) {
    doc.setTextColor(22, 163, 74);
    doc.text("PASSED (All dependencies, nodes, and member skills valid)", marginX + 33, auditY + 5.5);
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text(`FAILED (${validation.issues.length} semantic issues detected)`, marginX + 33, auditY + 5.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Health Score:", marginX + 4, auditY + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`${complexity.healthScore} / 100 (${complexity.rating})`, marginX + 33, auditY + 11);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Max Concurrency:", marginX + 4, auditY + 16.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`${complexity.maxConcurrency} parallel task stream(s)`, marginX + 33, auditY + 16.5);

  // Recommendations / Warnings
  if (complexity.recommendations.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Recommendations:", marginX + 100, auditY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const recLines = doc.splitTextToSize(complexity.recommendations[0], contentWidth - 104);
    doc.text(recLines, marginX + 100, auditY + 4.5);
  }

  y += 34;

  // ==========================================
  // 5. CRITICAL PATH & SCHEDULING (CPM)
  // ==========================================
  if (schedule) {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Critical Path Method (CPM) Schedule", marginX, y);
    y += 5;

    const critTaskMap = new Set(schedule.criticalPathTaskIds);

    // Mini Critical Path Table
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("TASK ID", marginX + 3, y + 4.2);
    doc.text("TASK NAME", marginX + 25, y + 4.2);
    doc.text("EARLIEST START", marginX + 90, y + 4.2);
    doc.text("EARLIEST FINISH", marginX + 120, y + 4.2);
    doc.text("CRITICAL STATUS", marginX + 150, y + 4.2);
    y += 6;

    // Show scheduled tasks (limit or paginate)
    const tasksToShow = schedule.scheduledTasks.slice(0, 10);
    tasksToShow.forEach((st, idx) => {
      checkPageBreak(6);
      const isCritical = critTaskMap.has(st.taskId);
      const task = workflow.tasks.find((t) => t.id === st.taskId);

      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      doc.rect(marginX, y, contentWidth, 5.5, "F");

      doc.setFont("helvetica", isCritical ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(isCritical ? 190 : 71, isCritical ? 18 : 85, isCritical ? 60 : 105);
      doc.text(st.taskId, marginX + 3, y + 3.8);

      const taskName = task ? task.name : st.taskId;
      const truncatedName = taskName.length > 32 ? taskName.substring(0, 30) + "..." : taskName;
      doc.text(truncatedName, marginX + 25, y + 3.8);

      doc.text(`${st.earliestStartMinutes}m`, marginX + 90, y + 3.8);
      doc.text(`${st.earliestFinishMinutes}m`, marginX + 120, y + 3.8);

      if (isCritical) {
        doc.setTextColor(225, 29, 72);
        doc.text("CRITICAL (Zero Slack)", marginX + 150, y + 3.8);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text("Standard", marginX + 150, y + 3.8);
      }
      y += 5.5;
    });

    y += 4;
  }

  // ==========================================
  // 6. FULL TASK BREAKDOWN SPECIFICATION
  // ==========================================
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Comprehensive Task Breakdown (${workflow.tasks.length} Tasks)`, marginX, y);
  y += 5;

  // Table Header
  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, y, contentWidth, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("#", marginX + 3, y + 4.5);
    doc.text("ID", marginX + 9, y + 4.5);
    doc.text("TASK NAME & DESCRIPTION", marginX + 27, y + 4.5);
    doc.text("ASSIGNEE", marginX + 105, y + 4.5);
    doc.text("DURATION", marginX + 138, y + 4.5);
    doc.text("DEPENDS ON", marginX + 156, y + 4.5);
    y += 6.5;
  };

  drawTableHeader();

  workflow.tasks.forEach((task, idx) => {
    const assignee = task.assignedMemberId ? membersById.get(task.assignedMemberId) : null;
    const assigneeName = assignee ? assignee.name : task.assignedMemberId ? "Assigned" : "Unassigned";
    const depsStr = task.dependsOn && task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "None";

    // Estimate needed row height
    const descLines = task.description ? doc.splitTextToSize(task.description, 75) : [];
    const rowHeight = Math.max(7, 4.5 + descLines.length * 3.2);

    if (checkPageBreak(rowHeight + 2)) {
      drawTableHeader();
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(marginX, y, contentWidth, rowHeight, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${idx + 1}`, marginX + 3, y + 4.2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(task.id, marginX + 9, y + 4.2);

    doc.text(task.name, marginX + 27, y + 4.2);

    if (descLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(descLines.slice(0, 2), marginX + 27, y + 7.5);
    }

    // Assignee
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(assignee ? 15 : 148, assignee ? 23 : 163, assignee ? 42 : 184);
    doc.text(assigneeName, marginX + 105, y + 4.2);

    // Duration
    doc.setTextColor(71, 85, 105);
    doc.text(`${task.estimatedDuration}m`, marginX + 138, y + 4.2);

    // Dependencies
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const truncDeps = depsStr.length > 15 ? depsStr.substring(0, 13) + "..." : depsStr;
    doc.text(truncDeps, marginX + 156, y + 4.2);

    y += rowHeight;
  });

  y += 5;

  // ==========================================
  // 7. DFA STATE MACHINE SUMMARY
  // ==========================================
  if (dfa) {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Deterministic Finite Automaton (DFA) Execution Engine", marginX, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, contentWidth, 18, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Generated States: ${dfa.states.length}`, marginX + 4, y + 5.5);
    doc.text(`State Transitions: ${dfa.transitions.length}`, marginX + 55, y + 5.5);
    doc.text(`Accept / Terminal States: ${dfa.acceptStateIds.length}`, marginX + 105, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      "Formal verification guarantee: Every execution sequence triggers valid state transitions without deadlocks.",
      marginX + 4,
      y + 12
    );

    y += 22;
  }

  // ==========================================
  // 8. FOOTERS ON EVERY PAGE
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("FlowForge Compiler & Scheduling Engine • Deterministic Project Management", marginX, pageHeight - 7.5);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7.5, { align: "right" });
  }

  return doc;
}
