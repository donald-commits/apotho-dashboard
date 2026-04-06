"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateRockDetails } from "@/app/actions/rocks";
import { SaveIcon } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not Started", color: "bg-gray-200 text-gray-700" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "at-risk", label: "At Risk", color: "bg-red-100 text-red-700" },
  { value: "complete", label: "Complete", color: "bg-green-100 text-green-700" },
];

export function RockDetailsForm({
  rockId,
  initialStatus,
  initialTargetDate,
}: {
  rockId: string;
  initialStatus: string;
  initialTargetDate: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [targetDate, setTargetDate] = useState(initialTargetDate || "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    setSaving(true);
    const fd = new FormData();
    fd.set("rockId", rockId);
    fd.set("status", status);
    fd.set("targetCompletionDate", targetDate);
    await updateRockDetails(fd);
    setSaving(false);
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setDirty(true); }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground">Target Completion Date</label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => { setTargetDate(e.target.value); setDirty(true); }}
            className="h-9"
          />
        </div>
        <div className="flex items-end">
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            <SaveIcon className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          s.value === status ? (
            <span key={s.value} className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
              {s.label}
            </span>
          ) : null
        ))}
        {targetDate && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
            Due: {new Date(targetDate + "T00:00:00").toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
