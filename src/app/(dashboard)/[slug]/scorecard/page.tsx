import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeftIcon } from "lucide-react";
import { ScorecardManager } from "@/components/scorecard/scorecard-manager";

interface PageProps {
  params: { slug: string };
}

function getMondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLast8Mondays(): Date[] {
  const mondays: Date[] = [];
  const today = new Date();
  const current = getMondayOf(today);
  for (let i = 0; i < 8; i++) {
    mondays.push(new Date(current));
    current.setDate(current.getDate() - 7);
  }
  return mondays.reverse();
}

export default async function ScorecardPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
  });

  if (!business) notFound();

  const mondays = getLast8Mondays();
  const oldest = mondays[0];

  const measurables = await prisma.measurable.findMany({
    where: { businessId: business.id },
    include: {
      entries: {
        where: { weekOf: { gte: oldest } },
        orderBy: { weekOf: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

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
        <h1 className="text-2xl font-bold tracking-tight">Scorecard</h1>
        <p className="text-sm text-muted-foreground mt-1">Weekly KPIs — last 8 weeks</p>
      </div>

      <ScorecardManager
        businessId={business.id}
        businessSlug={business.slug}
        measurables={measurables.map((m) => ({
          id: m.id,
          name: m.name,
          goal: m.goal,
          unit: m.unit ?? "",
          entries: m.entries.map((e) => ({
            id: e.id,
            weekOf: e.weekOf.toISOString(),
            actual: e.actual,
            onTrack: e.onTrack,
          })),
        }))}
        weeks={mondays.map((d) => d.toISOString())}
      />
    </div>
  );
}
