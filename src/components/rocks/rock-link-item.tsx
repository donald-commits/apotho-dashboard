"use client";

import Link from "next/link";
import { RockToggle } from "@/components/rocks/rock-toggle";
import { ChevronRightIcon } from "lucide-react";

export function RockLinkItem({
  rockId,
  href,
  title,
  ownerName,
  done,
  todoDone,
  todoTotal,
}: {
  rockId: string;
  href: string;
  title: string;
  ownerName?: string;
  done: boolean;
  todoDone: number;
  todoTotal: number;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50 hover:shadow-sm ${
        done ? "bg-muted/50 opacity-70" : "bg-card"
      }`}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <RockToggle rockId={rockId} done={done} />
      </div>
      <Link href={href} className="flex-1 min-w-0 cursor-pointer">
        <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {ownerName && <span>{ownerName}</span>}
          {todoTotal > 0 && (
            <span className={ownerName ? " ml-2" : ""}>
              &middot; {todoDone}/{todoTotal} to-dos
            </span>
          )}
        </p>
      </Link>
      <Link href={href} className="flex items-center gap-2 shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            done ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {done ? "Done" : "In Progress"}
        </span>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
