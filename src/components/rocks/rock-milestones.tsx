"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addRockMilestone,
  toggleRockMilestone,
  deleteRockMilestone,
} from "@/app/actions/rocks";
import {
  CheckCircle2Icon,
  CircleIcon,
  TrashIcon,
  PlusIcon,
} from "lucide-react";

type Milestone = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  done: boolean;
};

export function RockMilestones({
  rockId,
  milestones,
}: {
  rockId: string;
  milestones: Milestone[];
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;
    setAdding(true);
    const fd = new FormData();
    fd.set("rockId", rockId);
    fd.set("title", title.trim());
    fd.set("startDate", startDate);
    fd.set("endDate", endDate);
    await addRockMilestone(fd);
    setTitle("");
    setStartDate("");
    setEndDate("");
    setAdding(false);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {milestones.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground py-2">
          No milestones yet. Add key dates to build a Gantt timeline.
        </p>
      )}

      {milestones.map((m) => (
        <div key={m.id} className="flex items-center gap-3 rounded-md border px-3 py-2 group">
          <button onClick={() => toggleRockMilestone(m.id)} className="shrink-0">
            {m.done ? (
              <CheckCircle2Icon className="h-5 w-5 text-green-600" />
            ) : (
              <CircleIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium ${m.done ? "line-through text-muted-foreground" : ""}`}>
              {m.title}
            </span>
            <div className="text-xs text-muted-foreground">
              {new Date(m.startDate).toLocaleDateString()} &rarr; {new Date(m.endDate).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => deleteRockMilestone(m.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground pt-2 border-t"
        >
          <PlusIcon className="h-4 w-4" /> Add milestone
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 pt-2 border-t">
          <Input
            placeholder="Milestone name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8"
          />
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-muted-foreground">End</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={adding || !title.trim() || !startDate || !endDate}>
              {adding ? "..." : "Add Milestone"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
