"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addRockNote, deleteRockNote } from "@/app/actions/rocks";
import { TrashIcon, PlusIcon, MessageSquareIcon } from "lucide-react";

type Note = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
};

export function RockNotes({ rockId, notes }: { rockId: string; notes: Note[] }) {
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setAdding(true);
    const fd = new FormData();
    fd.set("rockId", rockId);
    fd.set("content", content.trim());
    await addRockNote(fd);
    setContent("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No notes yet. Add updates on current actions below.</p>
      )}

      {notes.map((note) => (
        <div key={note.id} className="rounded-md border px-4 py-3 group">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {note.authorName} &middot; {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <button
              onClick={() => deleteRockNote(note.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
            >
              <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex gap-2 mt-1 pt-2 border-t">
        <MessageSquareIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-2.5" />
        <textarea
          placeholder="Add a note on current actions or progress..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-end">
          <Button type="submit" size="sm" disabled={adding || !content.trim()}>
            <PlusIcon className="h-4 w-4 mr-1" />
            {adding ? "..." : "Add"}
          </Button>
        </div>
      </form>
    </div>
  );
}
