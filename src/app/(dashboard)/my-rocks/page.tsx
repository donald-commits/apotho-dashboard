import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RockToggle } from "@/components/rocks/rock-toggle";

interface SearchParams {
  q?: string;
  year?: string;
}

export default async function MyRocksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const currentYear = new Date().getFullYear();
  const selectedQ = parseInt(searchParams.q ?? "1", 10) || 1;
  const selectedYear = parseInt(searchParams.year ?? String(currentYear), 10) || currentYear;

  const rocks = await prisma.rock.findMany({
    where: { ownerId: session.user.id, quarter: selectedQ, year: selectedYear },
    include: { business: true },
    orderBy: [{ done: "asc" }, { createdAt: "asc" }],
  });

  const doneCount = rocks.filter((r) => r.done).length;

  // Group by business
  const byBusiness = rocks.reduce<Record<string, typeof rocks>>((acc, rock) => {
    const key = rock.business.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rock);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Rocks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Q{selectedQ} {selectedYear} &mdash; {doneCount}/{rocks.length} complete
        </p>
      </div>

      {/* Quarter filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4].map((q) => (
          <Link
            key={q}
            href={`/my-rocks?q=${q}&year=${selectedYear}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
              q === selectedQ
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            }`}
          >
            Q{q}
          </Link>
        ))}
      </div>

      {rocks.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">No rocks assigned to you for Q{selectedQ} {selectedYear}.</p>
      )}

      {Object.entries(byBusiness).map(([bizName, bizRocks]) => (
        <div key={bizName}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {bizName}
          </h2>
          <div className="flex flex-col gap-2">
            {bizRocks.map((rock) => (
              <div
                key={rock.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  rock.done ? "bg-muted/50 opacity-70" : "bg-card"
                }`}
              >
                <RockToggle rockId={rock.id} done={rock.done} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${rock.done ? "line-through text-muted-foreground" : ""}`}>
                    {rock.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    rock.done ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {rock.done ? "Done" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
