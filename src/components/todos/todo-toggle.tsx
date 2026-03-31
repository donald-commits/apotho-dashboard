"use client";

import { useTransition } from "react";
import { toggleTodo } from "@/app/actions/todos";
import { CheckSquare2Icon, SquareIcon } from "lucide-react";

interface TodoToggleProps {
  todoId: string;
  done: boolean;
}

export function TodoToggle({ todoId, done }: TodoToggleProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleTodo(todoId))}
      disabled={isPending}
      className="flex items-center justify-center h-6 w-6 shrink-0 transition-opacity disabled:opacity-50"
      title={done ? "Mark as not done" : "Mark as done"}
    >
      {done ? (
        <CheckSquare2Icon className="h-5 w-5 text-green-500" />
      ) : (
        <SquareIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}
