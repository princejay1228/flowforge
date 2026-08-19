"use client";

import * as React from "react";
import { Workflow } from "@/types/workflow";
import { Member } from "@/types/member";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { validateWorkflowSemantics } from "@/lib/validation/validate-workflow";
import { AlertTriangle, Clock, Play, Sparkles } from "lucide-react";
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
  const [dfaDialogOpen, setDfaDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setWorkflow(initialWorkflow);
  }, [initialWorkflow]);

  const validation = React.useMemo(() => validateWorkflowSemantics(workflow, members), [workflow, members]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveWorkflow(workflow);
    setIsSaving(false);
  };

  const handleSelfHeal = () => {
    const { repairedWorkflow, fixedIssuesCount } = selfHealWorkflow(workflow);
    if (fixedIssuesCount > 0) {
      setWorkflow(repairedWorkflow);
    }
  };

  const membersById = React.useMemo(() => new Map(members.map(m => [m.id, m])), [members]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">{workflow.name}</h2>
            <Badge variant="outline" className="capitalize">{workflow.domain}</Badge>
            <WorkflowComplexityBadge workflow={workflow} />
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{workflow.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDfaDialogOpen(true)}
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Simulate DFA</span>
          </Button>

          <Button onClick={handleSave} disabled={isSaving || !validation.valid}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {!validation.valid && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Semantic Validation Failed
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
              {validation.issues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {validation.valid && validation.issues.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Validation Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 text-sm text-amber-700/90 space-y-1">
            <ul className="list-disc pl-5">
              {validation.issues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tasks ({workflow.tasks.length})</h3>
        <div className="grid gap-3">
          {workflow.tasks.map((task) => {
            const assignee = task.assignedMemberId ? membersById.get(task.assignedMemberId) : null;
            return (
              <Card key={task.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.id}</span>
                    <h4 className="font-medium text-sm">{task.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                </div>
                
                <div className="flex items-center gap-6 text-xs text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {task.estimatedDuration}m
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {assignee ? (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {assignee.name}
                      </span>
                    ) : (
                      <span className="bg-muted px-2 py-0.5 rounded-full text-[10px]">Unassigned</span>
                    )}
                    {task.dependsOn.length > 0 && (
                      <span className="text-[10px]">Depends on: {task.dependsOn.join(", ")}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <DFAStepperDialog
        workflow={workflow}
        open={dfaDialogOpen}
        onOpenChange={setDfaDialogOpen}
      />
    </div>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
