"use client";

import React, { useState } from "react";
import type { Workflow } from "@/types/workflow";
import { calculateWorkflowComplexity } from "../complexity";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, AlertTriangle, Layers, GitCommit } from "lucide-react";

interface WorkflowComplexityBadgeProps {
  workflow: Workflow;
}

export function WorkflowComplexityBadge({ workflow }: WorkflowComplexityBadgeProps) {
  const [open, setOpen] = useState(false);
  const metrics = calculateWorkflowComplexity(workflow);

  const getVariant = () => {
    if (metrics.rating === "Optimal") return "secondary";
    if (metrics.rating === "Moderate") return "outline";
    return "destructive";
  };

  return (
    <>
      <Badge
        variant={getVariant()}
        className="cursor-pointer gap-1.5 px-3 py-1 text-xs hover:opacity-80 transition-all shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Activity className="h-3.5 w-3.5" />
        <span>Complexity: {metrics.rating} ({metrics.healthScore}/100)</span>
      </Badge>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Workflow Health & Complexity Metrics"
        description="Formal analysis of structural graph complexity, concurrency, and bottleneck risks."
      >
        <div className="space-y-4 py-2">
          {/* Main Health Card */}
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/40">
            <div className="flex items-center gap-3">
              {metrics.rating === "Optimal" ? (
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              )}
              <div>
                <p className="font-semibold text-base">Health Rating: {metrics.rating}</p>
                <p className="text-xs text-muted-foreground">
                  McCabe Cyclomatic Index: {metrics.cyclomaticComplexity}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{metrics.healthScore}</span>
              <span className="text-xs text-muted-foreground"> / 100</span>
            </div>
          </div>

          {/* Metric Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="flex justify-center mb-1 text-muted-foreground">
                <GitCommit className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Tasks / Edges</p>
              <p className="font-semibold text-sm mt-0.5">{metrics.nodesCount} / {metrics.edgesCount}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex justify-center mb-1 text-muted-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Max Concurrency</p>
              <p className="font-semibold text-sm mt-0.5">{metrics.maxConcurrency} parallel</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex justify-center mb-1 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">Bottleneck Nodes</p>
              <p className="font-semibold text-sm mt-0.5">{metrics.bottleneckTaskIds.length}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Optimization Advice
            </h4>
            <div className="rounded-lg border bg-background p-3 space-y-1.5">
              {metrics.recommendations.map((rec, idx) => (
                <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{rec}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
