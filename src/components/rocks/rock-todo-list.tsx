"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTodo, toggleTodo, deleteTodo } from "@/app/actions/todos";
import { CheckCircle2Icon, CircleIcon, TrashIcon, PlusIcon } from "lucide-react";

type TodoItem = {
  id: string;
  title: string;
  done: boolean;
  ownerName: string;
  dueDate: string | null;
};

export function RockTodoList({
  todos,
  rockId,
  businessId,
  users,
  currentUserId,
}: {
  todos: TodoItem[];
  rockId: string;
  businessId: string;
  users: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newOwnerId, setNewOwnerId] = useState(currentUserId);
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const fd = new FormData();
    fd.set("title", newTitle.trim());
    fd.set("businessId", businessId);
    fd.set("ownerId", newOwnerId);
    fd.set("rockId", rockId);
    await createTodo(fd);
    setNewTitle("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {todos.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No to-dos yet. Add one below.</p>
      )}

      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center gap-3 rounded-md border px-3 py-2 group"
        >
          <button
            onClick={() => toggleTodo(todo.id)}
            className="shrink-0"
          >
            {todo.done ? (
              <CheckCircle2Icon className="h-5 w-5 text-green-600" />
            ) : (
              <CircleIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <span className={`text-sm ${todo.done ? "line-through text-muted-foreground" : ""}`}>
              {todo.title}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ({todo.ownerName})
            </span>
            {todo.dueDate && (
              <span className="text-xs text-muted-foreground ml-2">
                Due: {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex items-center gap-2 mt-2 pt-2 border-t">
        <PlusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Add a to-do for this rock..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 h-8"
        />
        <select
          value={newOwnerId}
          onChange={(e) => setNewOwnerId(e.target.value)}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={adding || !newTitle.trim()}>
          {adding ? "..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
