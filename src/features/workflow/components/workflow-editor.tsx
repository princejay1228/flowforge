"use client";

import * as React from "react";
import type { Workflow } from "@/types/workflow";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import type { Member } from "@/types/member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { validateWorkflowSemantics } from "@/lib/validation/validate-workflow";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  Check,
} from "lucide-react";
import { useWorkflows } from "@/hooks/use-workflows";
import { WorkflowComplexityBadge } from "@/features/validation";
import { DFAStepperDialog } from "@/features/dfa";
import { selfHealWorkflow } from "@/features/ai";

interface WorkflowEditorProps {
  workflow: Workflow;
  members: Member[];
}

export function WorkflowEditor({ workflow: initialWorkflow, members }: WorkflowEditorProps) {
  const [workflow, setWorkflow] = React.useState<Workflow>(initialWorkflow);
  const { saveWorkflow } = useWorkflows(workflow.projectId);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [dfaDialogOpen, setDfaDialogOpen] = React.useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Task Edit / Create Dialog state
  const [taskModalOpen, setTaskModalOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);

  // Form State
  const [formName, setFormName] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formDuration, setFormDuration] = React.useState(30);
  const [formPriority, setFormPriority] = React.useState<TaskPriority>("medium");
  const [formStatus, setFormStatus] = React.useState<TaskStatus>("not_started");
  const [formAssignee, setFormAssignee] = React.useState<string>("");
  const [formDependsOn, setFormDependsOn] = React.useState<string[]>([]);

  // Self-heal feedback state
  const [healNotice, setHealNotice] = React.useState<{ count: number; logs: string[] } | null>(null);

  React.useEffect(() => {
    setWorkflow(initialWorkflow);
  }, [initialWorkflow]);

  const validation = React.useMemo(
    () => validateWorkflowSemantics(workflow, members),
    [workflow, members]
  );

  const errors = React.useMemo(
    () => validation.issues.filter((i) => i.severity === "error"),
    [validation]
  );

  const warnings = React.useMemo(
    () => validation.issues.filter((i) => i.severity === "warning"),
    [validation]
  );

  const membersById = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const handleSave = async () => {
    setIsSaving(true);
    await saveWorkflow(workflow);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSelfHeal = () => {
    const { repairedWorkflow, fixedIssuesCount, logs } = selfHealWorkflow(workflow, members);
    if (fixedIssuesCount > 0) {
      setWorkflow(repairedWorkflow);
      setHealNotice({ count: fixedIssuesCount, logs });
    } else {
      setHealNotice({ count: 0, logs: ["No structural anomalies or cycles detected."] });
    }
  };

  // Open modal for editing existing task
  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setFormName(task.name);
    setFormDescription(task.description || "");
    setFormDuration(task.estimatedDuration || 30);
    setFormPriority(task.priority || "medium");
    setFormStatus(task.status || "not_started");
    setFormAssignee(task.assignedMemberId || "");
    setFormDependsOn(task.dependsOn || []);
    setTaskModalOpen(true);
  };

  // Open modal for creating new task
  const openCreateTask = () => {
    setEditingTaskId(null);
    setFormName("");
    setFormDescription("");
    setFormDuration(30);
    setFormPriority("medium");
    setFormStatus("not_started");
    setFormAssignee("");
    setFormDependsOn([]);
    setTaskModalOpen(true);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (!confirm(`Are you sure you want to delete task "${taskId}"?`)) return;

    setWorkflow((prev) => {
      const updatedTasks = prev.tasks
        .filter((t) => t.id !== taskId)
        .map((t) => ({
          ...t,
          dependsOn: t.dependsOn.filter((id) => id !== taskId),
        }));

      const updatedDeps = prev.dependencies.filter(
        (d) => d.sourceTaskId !== taskId && d.targetTaskId !== taskId
      );

      return {
        ...prev,
        tasks: updatedTasks,
        dependencies: updatedDeps,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Save task from modal
  const handleSaveTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const now = new Date().toISOString();

    if (editingTaskId) {
      // Update existing task
      setWorkflow((prev) => {
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id !== editingTaskId) return t;
          return {
            ...t,
            name: formName.trim(),
            description: formDescription.trim(),
            estimatedDuration: Number(formDuration) || 15,
            priority: formPriority,
            status: formStatus,
            assignedMemberId: formAssignee || undefined,
            dependsOn: formDependsOn,
            updatedAt: now,
          };
        });

        // Rebuild dependencies for this task
        const otherDeps = prev.dependencies.filter((d) => d.targetTaskId !== editingTaskId);
        const newDeps = formDependsOn.map((sourceId) => ({
          id: `dep_${sourceId}_${editingTaskId}`,
          workflowId: prev.id,
          sourceTaskId: sourceId,
          targetTaskId: editingTaskId,
          dependencyType: "finish_to_start" as const,
        }));

        return {
          ...prev,
          tasks: updatedTasks,
          dependencies: [...otherDeps, ...newDeps],
          updatedAt: now,
        };
      });
    } else {
      // Create new task
      const newId = `task_${Date.now().toString(36)}`;
      const newTask: Task = {
        id: newId,
        workflowId: workflow.id,
        name: formName.trim(),
        description: formDescription.trim(),
        estimatedDuration: Number(formDuration) || 15,
        priority: formPriority,
        status: formStatus,
        requiredSkills: [],
        dependsOn: formDependsOn,
        assignedMemberId: formAssignee || undefined,
        classification: "mandatory",
        createdAt: now,
        updatedAt: now,
      };

      const newDeps = formDependsOn.map((sourceId) => ({
        id: `dep_${sourceId}_${newId}`,
        workflowId: workflow.id,
        sourceTaskId: sourceId,
        targetTaskId: newId,
        dependencyType: "finish_to_start" as const,
      }));

      setWorkflow((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
        dependencies: [...prev.dependencies, ...newDeps],
        updatedAt: now,
      }));
    }

    setTaskModalOpen(false);
  };

  // Toggle dependency in form
  const toggleDependency = (depId: string) => {
    setFormDependsOn((prev) =>
      prev.includes(depId) ? prev.filter((id) => id !== depId) : [...prev, depId]
    );
  };

  // Filter tasks
  const filteredTasks = workflow.tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{workflow.name}</h2>
            <Badge variant="outline" className="capitalize">
              {workflow.domain.replace(/_/g, " ")}
            </Badge>
            <WorkflowComplexityBadge workflow={workflow} />
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{workflow.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDfaDialogOpen(true)}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Simulate DFA</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreateTask}
            variant="outline"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || errors.length > 0}
            size="sm"
            className="gap-1.5"
          >
            {saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            )}
          </Button>
        </div>
      </div>

      {/* Heal Notice Banner */}
      {healNotice && (
        <Card className="border-emerald-500/50 bg-emerald-500/10">
          <CardContent className="p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <strong>Self-Heal Applied:</strong> Fixed {healNotice.count} issue(s).
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {healNotice.logs.join(" • ")}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHealNotice(null)}
              className="text-xs h-7 px-2"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Structural / Semantic Blocking Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Semantic Validation Failed ({errors.length} Blocking Issue{errors.length > 1 ? "s" : ""})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelfHeal}
              className="gap-1.5 text-xs bg-background hover:bg-muted border-destructive/30"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Self-Heal Graph</span>
            </Button>
          </CardHeader>
          <CardContent className="pb-3 text-sm text-destructive/90 space-y-1">
            <ul className="list-disc pl-5">
              {errors.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Advisory Warnings */}
      {warnings.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Skill Allocation Advisories ({warnings.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelfHeal}
              className="gap-1.5 text-xs bg-background hover:bg-muted border-amber-500/30 text-amber-600 dark:text-amber-400"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Auto-Align Skills</span>
            </Button>
          </CardHeader>
          <CardContent className="pb-3 text-sm text-amber-700/90 dark:text-amber-300/90 space-y-1">
            <ul className="list-disc pl-5">
              {warnings.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "not_started", "in_progress", "completed", "blocked"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs capitalize h-8"
            >
              {status === "all" ? "All Tasks" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            Tasks ({filteredTasks.length} of {workflow.tasks.length})
          </h3>
        </div>

        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            No tasks match your search or filter.
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((task) => {
              const assignee = task.assignedMemberId ? membersById.get(task.assignedMemberId) : null;
              return (
                <Card
                  key={task.id}
                  className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all hover:border-primary/40"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {task.id}
                      </span>
                      <h4 className="font-medium text-sm truncate">{task.name}</h4>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase font-semibold tracking-wider"
                      >
                        {task.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    {task.dependsOn.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium">Prerequisites:</span> {task.dependsOn.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{task.estimatedDuration}m</span>
                    </div>

                    <div>
                      {assignee ? (
                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {assignee.name}
                        </span>
                      ) : (
                        <span className="bg-muted px-2.5 py-1 rounded-full text-[11px]">Unassigned</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditTask(task)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit Task"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                        className="h-8 w-8 text-destructive/70 hover:text-destructive"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Edit/Create Dialog */}
      <Dialog
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        title={editingTaskId ? `Edit Task (${editingTaskId})` : "Add New Task"}
        description="Configure task execution parameters, duration, team assignment, and dependencies."
      >
        <form onSubmit={handleSaveTaskForm} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Task Name</label>
            <Input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Set up authentication middleware"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Description</label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Detailed instructions and acceptance criteria..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Duration (minutes)</label>
              <Input
                type="number"
                min="1"
                required
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="not_started">Not Started</option>
                <option value="ready">Ready</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Assigned Member</label>
            <select
              value={formAssignee}
              onChange={(e) => setFormAssignee(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role}) — {m.skills.join(", ")}
                </option>
              ))}
            </select>
          </div>

          {/* Dependency selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Prerequisite Dependencies</label>
            <div className="max-h-36 overflow-y-auto border rounded-md p-2 space-y-1 bg-muted/20">
              {workflow.tasks
                .filter((t) => t.id !== editingTaskId)
                .map((t) => {
                  const isChecked = formDependsOn.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-muted text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleDependency(t.id)}
                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="font-mono text-muted-foreground">{t.id}</span>
                      <span className="truncate">{t.name}</span>
                    </label>
                  );
                })}
              {workflow.tasks.filter((t) => t.id !== editingTaskId).length === 0 && (
                <p className="text-xs text-muted-foreground p-1">No other tasks to depend on.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTaskId ? "Update Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <DFAStepperDialog
        workflow={workflow}
        open={dfaDialogOpen}
        onOpenChange={setDfaDialogOpen}
      />
    </div>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
