"use client";

import { useTransition } from "react";
import { toggleRock } from "@/app/actions/rocks";
import { CheckCircle2Icon, CircleIcon } from "lucide-react";

interface RockToggleProps {
  rockId: string;
  done: boolean;
}

export function RockToggle({ rockId, done }: RockToggleProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => toggleRock(rockId))}
      disabled={isPending}
      className="flex items-center justify-center h-6 w-6 shrink-0 transition-opacity disabled:opacity-50"
      title={done ? "Mark as not done" : "Mark as done"}
    >
      {done ? (
        <CheckCircle2Icon className="h-5 w-5 text-green-500" />
      ) : (
        <CircleIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  );
}
