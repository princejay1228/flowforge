"use client";

import * as React from "react";
import { Search, Edit, Trash2, UserCheck, Clock, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/types/member";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const workloadPercent = Math.round(member.workload * 100);
  const capacityPercent = Math.round(member.availability.capacityFraction * 100);

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{member.name}</CardTitle>
              <CardDescription className="text-xs font-medium text-foreground/80">
                {member.role}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(member)}
              title="Edit Member"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(member)}
              title="Delete Member"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 text-xs">
        {/* Workload & Capacity */}
        <div className="space-y-1 rounded-md bg-muted/40 p-2.5">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="flex items-center gap-1">
              Current workload: <strong className="text-foreground">{workloadPercent}%</strong>
            </span>
            <span className="text-muted-foreground">Capacity: {capacityPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all ${
                workloadPercent > 90
                  ? "bg-destructive"
                  : workloadPercent > 70
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(workloadPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-0.5">
            <Info className="h-3 w-3 shrink-0" />
            <span>Future scheduler engine will dynamically calculate/update workload.</span>
          </div>
        </div>

        {/* Skills */}
        {member.skills.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Skills:
            </span>
            <div className="flex flex-wrap gap-1">
              {member.skills.map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Specialties */}
        {member.specialties.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Specialties:
            </span>
            <div className="flex flex-wrap gap-1">
              {member.specialties.map((spec, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] py-0 px-2">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Working Hours Summary */}
        {member.availability.workingHours.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {member.availability.workingHours.map((wh) => DAYS_SHORT[wh.dayOfWeek]).join(", ")}
            </span>
          </div>
        )}

        {/* Notes / Experience */}
        {member.experience && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 italic pt-1">
            &ldquo;{member.experience}&rdquo;
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onAddMember: () => void;
}

export function MemberList({ members, onEdit, onDelete, onAddMember }: MemberListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query) ||
        m.skills.some((s) => s.toLowerCase().includes(query)) ||
        m.specialties.some((sp) => sp.toLowerCase().includes(query))
    );
  }, [members, searchQuery]);

  if (members.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
          <UserCheck className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-semibold">No team members yet</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Add human resources, roles, or actors to this workspace so the workflow compiler can assign tasks and verify skill constraints.
        </p>
        <Button className="mt-6" onClick={onAddMember}>
          Add First Member
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by name, role, skill..."
            className="pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground w-full sm:w-auto text-right">
          Showing {filteredMembers.length} of {members.length} {members.length === 1 ? "member" : "members"}
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No team members match &ldquo;{searchQuery}&rdquo;.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
