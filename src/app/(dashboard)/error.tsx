"use client";

import Link from "next/link";
import { AlertTriangleIcon, HomeIcon, RotateCwIcon } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 animate-fade-in-up">
      <div className="max-w-lg w-full rounded-2xl border bg-card p-8 shadow-xl shadow-primary/5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mb-4">
          <AlertTriangleIcon className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Something went wrong on this page
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          The page hit an unexpected error. You can try again or go back to the dashboard.
        </p>
        {error?.message && (
          <pre className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 hover:-translate-y-0.5"
          >
            <RotateCwIcon className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border bg-card text-sm font-medium hover:bg-accent hover:-translate-y-0.5"
          >
            <HomeIcon className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
