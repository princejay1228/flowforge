"use client";

import * as React from "react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Info } from "lucide-react";
import type { Member, WorkingHours } from "@/types/member";
import type { CreateMemberPayload, UpdateMemberPayload } from "@/hooks/use-members";

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSubmit: (
    payload: CreateMemberPayload | UpdateMemberPayload
  ) => Promise<{ success: boolean; error?: string }>;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface MemberFormProps {
  member?: Member | null;
  onSubmit: (
    payload: CreateMemberPayload | UpdateMemberPayload
  ) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  formId?: string;
}

function MemberForm({ member, onSubmit, onCancel, formId }: MemberFormProps) {
  const [name, setName] = React.useState(member?.name || "");
  const [role, setRole] = React.useState(member?.role || "");
  const [experience, setExperience] = React.useState(member?.experience || "");
  const [skillsText, setSkillsText] = React.useState(member ? member.skills.join(", ") : "");
  const [specialtiesText, setSpecialtiesText] = React.useState(
    member ? member.specialties.join(", ") : ""
  );
  const [preferredTaskTypesText, setPreferredTaskTypesText] = React.useState(
    member ? member.preferredTaskTypes.join(", ") : ""
  );
  const [capacityFraction, setCapacityFraction] = React.useState(
    member ? member.availability.capacityFraction.toString() : "1.0"
  );
  const [workload, setWorkload] = React.useState(
    member ? member.workload.toString() : "0.0"
  );
  const [unavailableDatesText, setUnavailableDatesText] = React.useState(
    member ? member.availability.unavailableDates.join(", ") : ""
  );
  const [workingHours, setWorkingHours] = React.useState<WorkingHours[]>(
    member && member.availability.workingHours.length > 0
      ? member.availability.workingHours
      : [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
        ]
  );
  const [notes, setNotes] = React.useState(member?.notes || "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const parseCommaList = (text: string): string[] => {
    return text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleAddWorkingHour = () => {
    setWorkingHours((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const handleRemoveWorkingHour = (index: number) => {
    setWorkingHours((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWorkingHourChange = (
    index: number,
    field: keyof WorkingHours,
    value: string | number
  ) => {
    setWorkingHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedCap = parseFloat(capacityFraction);
    if (isNaN(parsedCap) || parsedCap < 0 || parsedCap > 1) {
      setError("Capacity fraction must be a number between 0 and 1 (e.g. 1.0 for 100%).");
      return;
    }

    const parsedWorkload = parseFloat(workload);
    if (isNaN(parsedWorkload) || parsedWorkload < 0 || parsedWorkload > 1) {
      setError("Current workload must be a number between 0 and 1 (e.g. 0.5 for 50%).");
      return;
    }

    const payload: CreateMemberPayload = {
      workspaceId: member ? member.workspaceId : "",
      name: name.trim(),
      role: role.trim(),
      experience: experience.trim(),
      skills: parseCommaList(skillsText),
      specialties: parseCommaList(specialtiesText),
      preferredTaskTypes: parseCommaList(preferredTaskTypesText),
      availability: {
        capacityFraction: parsedCap,
        workingHours: workingHours.map((wh) => ({
          dayOfWeek: Number(wh.dayOfWeek),
          startTime: wh.startTime,
          endTime: wh.endTime,
        })),
        unavailableDates: parseCommaList(unavailableDatesText),
      },
      workload: parsedWorkload,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    const res = await onSubmit(payload);
    setIsSubmitting(false);

    if (res.success) {
      onCancel();
    } else {
      setError(res.error || "Failed to save member details.");
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 pt-2">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Dr. Sarah Jenkins, Alex Chen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">
            Role / Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Senior Nurse, Sous Chef, Frontend Lead"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Skills (comma-separated)
        </label>
        <Input
          placeholder="e.g. Triage, IV Line Insertion, CPR, React, Python"
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Specialties (comma-separated)
        </label>
        <Input
          placeholder="e.g. Emergency Medicine, Pastry, System Architecture"
          value={specialtiesText}
          onChange={(e) => setSpecialtiesText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Experience Description
        </label>
        <Textarea
          placeholder="Background, certifications, relevant project experience..."
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">
            Weekly Capacity Fraction (0.0 to 1.0)
          </label>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            placeholder="1.0 (Full-time)"
            value={capacityFraction}
            onChange={(e) => setCapacityFraction(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="text-[11px] text-muted-foreground">
            1.0 = 100% full-time; 0.5 = 50% part-time.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none">
            Current Workload (0.0 to 1.0)
          </label>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            placeholder="0.0"
            value={workload}
            onChange={(e) => setWorkload(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            <Info className="h-3 w-3 shrink-0" />
            <span>Future scheduler engine will dynamically calculate workload.</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none">
            Working Hours Schedule
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddWorkingHour}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Add Shift</span>
          </Button>
        </div>

        {workingHours.map((wh, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              value={wh.dayOfWeek}
              onChange={(e) =>
                handleWorkingHourChange(idx, "dayOfWeek", parseInt(e.target.value, 10))
              }
            >
              {DAYS_OF_WEEK.map((day, dIdx) => (
                <option key={dIdx} value={dIdx}>
                  {day}
                </option>
              ))}
            </select>

            <Input
              type="time"
              className="h-9 text-xs"
              value={wh.startTime}
              onChange={(e) =>
                handleWorkingHourChange(idx, "startTime", e.target.value)
              }
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              className="h-9 text-xs"
              value={wh.endTime}
              onChange={(e) =>
                handleWorkingHourChange(idx, "endTime", e.target.value)
              }
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemoveWorkingHour(idx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t pt-3">
        <label className="text-sm font-medium leading-none">
          Unavailable Dates (comma-separated YYYY-MM-DD)
        </label>
        <Input
          placeholder="e.g. 2026-08-15, 2026-09-01"
          value={unavailableDatesText}
          onChange={(e) => setUnavailableDatesText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Preferred Task Types (comma-separated)
        </label>
        <Input
          placeholder="e.g. Emergency Surgery, Baking, Code Review"
          value={preferredTaskTypesText}
          onChange={(e) => setPreferredTaskTypesText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">Notes</label>
        <Textarea
          placeholder="Additional constraints, preferred shifts, or team notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}

const MEMBER_FORM_ID = "member-form";

export function MemberFormDialog({
  open,
  onOpenChange,
  member,
  onSubmit,
}: MemberFormDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={member ? `Edit ${member.name}` : "Add Team Member"}
      description="Define role, skills, working hours, and capacity for process compilation."
      className="max-w-2xl"
    >
      <MemberForm
        key={member?.id || "new-member"}
        member={member}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
        formId={MEMBER_FORM_ID}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" form={MEMBER_FORM_ID}>
          {member ? "Save Changes" : "Add Member"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
