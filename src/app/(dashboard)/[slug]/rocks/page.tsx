import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RockToggle } from "@/components/rocks/rock-toggle";
import { AddRockForm } from "@/components/rocks/add-rock-form";
import { ChevronLeftIcon } from "lucide-react";

interface PageProps {
  params: { slug: string };
  searchParams: { q?: string; year?: string };
}

const QUARTERS = [1, 2, 3, 4];

export default async function BusinessRocksPage({ params, searchParams }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { owners: { include: { user: true } } },
  });

  if (!business) notFound();

  const currentYear = new Date().getFullYear();
  const selectedQ = parseInt(searchParams.q ?? "1", 10) || 1;
  const selectedYear = parseInt(searchParams.year ?? String(currentYear), 10) || currentYear;

  const rocks = await prisma.rock.findMany({
    where: { businessId: business.id, quarter: selectedQ, year: selectedYear },
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });

  const owners = business.owners.map((o) => ({ id: o.user.id, name: o.user.name }));
  const doneCount = rocks.filter((r) => r.done).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/${params.slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          {business.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Rocks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Q{selectedQ} {selectedYear} &mdash; {doneCount}/{rocks.length} complete
        </p>
      </div>

      {/* Quarter / year filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUARTERS.map((q) => (
          <Link
            key={q}
            href={`/${params.slug}/rocks?q=${q}&year=${selectedYear}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
              q === selectedQ
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            }`}
          >
            Q{q}
          </Link>
        ))}
        <span className="text-sm text-muted-foreground ml-2">{selectedYear}</span>
      </div>

      {/* Rocks list */}
      <div className="flex flex-col gap-2">
        {rocks.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No rocks for Q{selectedQ} {selectedYear}.</p>
        )}
        {rocks.map((rock) => (
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
              <p className="text-xs text-muted-foreground mt-0.5">{rock.owner.name}</p>
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

      <AddRockForm
        businessId={business.id}
        businessSlug={business.slug}
        owners={owners}
        defaultQuarter={selectedQ}
        defaultYear={selectedYear}
      />
    </div>
  );
}
