"use client";

import * as React from "react";
import type { Workflow } from "@/types/workflow";
import type { ScheduleResult } from "@/features/scheduler";

interface GanttChartProps {
  workflow: Workflow;
  schedule: ScheduleResult;
}

export function GanttChart({ workflow, schedule }: GanttChartProps) {
  const taskMap = React.useMemo(() => new Map(workflow.tasks.map(t => [t.id, t])), [workflow]);
  const totalMinutes = schedule.totalDurationMinutes || 1; // avoid div by 0

  return (
    <div className="w-full border rounded-md bg-background overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Schedule Timeline</h3>
          <p className="text-sm text-muted-foreground">Total Duration: {totalMinutes}m</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-sm"></div>
            <span>Standard Task</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-destructive rounded-sm"></div>
            <span>Critical Path</span>
          </div>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[600px] space-y-2">
          {schedule.scheduledTasks.map((st) => {
            const task = taskMap.get(st.taskId);
            if (!task) return null;

            const startPercent = (st.earliestStartMinutes / totalMinutes) * 100;
            const widthPercent = (task.estimatedDuration / totalMinutes) * 100;

            return (
              <div key={st.taskId} className="relative h-8 flex items-center group">
                <div className="w-32 shrink-0 text-sm truncate pr-2 font-medium" title={task.name}>
                  {task.name}
                </div>
                <div className="flex-1 relative h-full bg-muted/30 rounded-md">
                  <div
                    className={`absolute h-full rounded-md flex items-center px-2 text-[10px] text-white font-medium truncate ${st.isCriticalPath ? 'bg-destructive' : 'bg-primary'}`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                      minWidth: "24px" // ensuring tiny tasks are visible
                    }}
                    title={`${task.name}: ${st.earliestStartMinutes}m - ${st.earliestFinishMinutes}m`}
                  >
                    {task.estimatedDuration}m
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
