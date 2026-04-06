"use client";

type Milestone = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  done: boolean;
};

export function GanttChart({
  milestones,
  targetCompletionDate,
}: {
  milestones: Milestone[];
  targetCompletionDate: string | null;
}) {
  if (milestones.length === 0) return null;

  // Calculate date range across all milestones
  const allDates = milestones.flatMap((m) => [
    new Date(m.startDate).getTime(),
    new Date(m.endDate).getTime(),
  ]);
  if (targetCompletionDate) {
    allDates.push(new Date(targetCompletionDate).getTime());
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  allDates.push(today.getTime());

  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  // Add some padding
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  function dayOffset(dateStr: string) {
    const d = new Date(dateStr);
    return Math.ceil((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  function todayOffset() {
    return Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Generate month labels
  const months: { label: string; offset: number }[] = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  if (cursor < minDate) cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= maxDate) {
    months.push({
      label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      offset: Math.ceil((cursor.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {/* Month labels */}
      <div className="relative h-6 ml-[180px]" style={{ minWidth: `${totalDays * 4}px` }}>
        {months.map((m, i) => (
          <span
            key={i}
            className="absolute text-[10px] text-muted-foreground font-medium"
            style={{ left: `${(m.offset / totalDays) * 100}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((m) => {
        const start = dayOffset(m.startDate);
        const end = dayOffset(m.endDate);
        const width = Math.max(1, end - start);
        const pctLeft = (start / totalDays) * 100;
        const pctWidth = (width / totalDays) * 100;

        return (
          <div key={m.id} className="flex items-center h-8 gap-2">
            <div className="w-[180px] shrink-0 truncate text-xs font-medium pr-2 text-right">
              {m.title}
            </div>
            <div
              className="relative flex-1 h-6 bg-muted/30 rounded"
              style={{ minWidth: `${totalDays * 4}px` }}
            >
              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-px bg-orange-400 z-10"
                style={{ left: `${(todayOffset() / totalDays) * 100}%` }}
              />
              {/* Target completion marker */}
              {targetCompletionDate && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400 z-10 border-dashed"
                  style={{ left: `${(dayOffset(targetCompletionDate) / totalDays) * 100}%` }}
                />
              )}
              {/* Bar */}
              <div
                className={`absolute top-1 bottom-1 rounded-sm ${
                  m.done
                    ? "bg-green-500"
                    : new Date(m.endDate) < today
                    ? "bg-red-400"
                    : "bg-blue-500"
                }`}
                style={{
                  left: `${pctLeft}%`,
                  width: `${pctWidth}%`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-4 mt-2 ml-[180px] text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-blue-500 rounded-sm inline-block" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-green-500 rounded-sm inline-block" /> Complete
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 bg-red-400 rounded-sm inline-block" /> Overdue
        </span>
        <span className="flex items-center gap-1">
          <span className="w-px h-3 bg-orange-400 inline-block" /> Today
        </span>
        {targetCompletionDate && (
          <span className="flex items-center gap-1">
            <span className="w-px h-3 bg-red-400 inline-block border-dashed" /> Target Date
          </span>
        )}
      </div>
    </div>
  );
}
