import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TargetIcon,
  CheckSquareIcon,
  CalendarIcon,
  BarChart2Icon,
  DollarSignIcon,
  BuildingIcon,
  ChevronRightIcon,
} from "lucide-react";
import { StartMeetingButton } from "@/components/meetings/start-meeting-button";
import { FinancialsDashboard } from "@/components/financials/financials-dashboard";

const APOTHO_SLUG = "apotho-improvements";

export default async function ApothoImprovementsPage() {
  const apotho = await prisma.business.findUnique({ where: { slug: APOTHO_SLUG } });
  if (!apotho) notFound();

  // Pull every other business so the portfolio view can show them
  const allBusinesses = await prisma.business.findMany({
    where: { slug: { not: APOTHO_SLUG } },
    orderBy: { name: "asc" },
    include: {
      owners: { include: { user: true } },
      rocks: {
        where: { year: 2026 },
        select: { id: true, done: true, quarter: true },
      },
      todos: { where: { done: false }, select: { id: true } },
      meetings: {
        orderBy: { date: "desc" },
        take: 1,
        select: { id: true, date: true, endedAt: true, avgRating: true },
      },
    },
  });

  // Apotho Improvements' own meetings (where the cross-portfolio Level-10 is run)
  const portfolioMeetings = await prisma.meeting.findMany({
    where: { businessId: apotho.id },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Cross-portfolio open todos owned by Apotho Improvements meetings (i.e. assigned out
  // to subsidiaries from a portfolio meeting)
  const crossPortfolioTodos = await prisma.todo.findMany({
    where: {
      done: false,
      meeting: { businessId: apotho.id },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      business: { select: { name: true, slug: true } },
      owner: { select: { name: true } },
    },
  });

  const totalRocks = allBusinesses.reduce((s, b) => s + b.rocks.length, 0);
  const doneRocks = allBusinesses.reduce(
    (s, b) => s + b.rocks.filter((r) => r.done).length,
    0,
  );
  const totalOpenTodos = allBusinesses.reduce((s, b) => s + b.todos.length, 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Apotho Improvements</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Parent company hub — every subsidiary, one cockpit. Run portfolio meetings and assign
              to-dos across any business in the group.
            </p>
          </div>
          <StartMeetingButton
            businessId={apotho.id}
            businessSlug={apotho.slug}
            label="Run Portfolio Meeting"
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat
          icon={<BuildingIcon className="h-4 w-4 text-primary" />}
          label="Subsidiaries"
          value={allBusinesses.length}
        />
        <SummaryStat
          icon={<TargetIcon className="h-4 w-4 text-orange-500" />}
          label="2026 Rocks"
          value={`${doneRocks}/${totalRocks}`}
        />
        <SummaryStat
          icon={<CheckSquareIcon className="h-4 w-4 text-blue-500" />}
          label="Open To-Dos"
          value={totalOpenTodos}
        />
        <SummaryStat
          icon={<CalendarIcon className="h-4 w-4 text-purple-500" />}
          label="Portfolio Meetings"
          value={portfolioMeetings.length}
        />
      </div>

      {/* Sub-nav (financials, scorecard, etc. still use [slug] routes) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NavCard
          href={`/${APOTHO_SLUG}/financials`}
          icon={DollarSignIcon}
          label="Portfolio Financials"
          description="Rollup of MACU + AmEx across all subs"
        />
        <NavCard
          href={`/${APOTHO_SLUG}/meetings`}
          icon={CalendarIcon}
          label="Meetings"
          description="Cross-portfolio Level 10 history"
        />
        <NavCard
          href={`/${APOTHO_SLUG}/todos`}
          icon={CheckSquareIcon}
          label="Portfolio To-Dos"
          description="Items raised in portfolio meetings"
        />
        <NavCard
          href={`/${APOTHO_SLUG}/scorecard`}
          icon={BarChart2Icon}
          label="Scorecard"
          description="Portfolio-level KPIs"
        />
      </div>

      {/* Subsidiaries grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Subsidiaries</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allBusinesses.map((b) => {
            const open = b.rocks.filter((r) => !r.done).length;
            const done = b.rocks.length - open;
            const pct = b.rocks.length > 0 ? Math.round((done / b.rocks.length) * 100) : 0;
            const lastMeeting = b.meetings[0];
            return (
              <Link key={b.id} href={`/${b.slug}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{b.name}</CardTitle>
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    {b.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {b.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">2026 Rocks</span>
                      <span className="font-medium">{done}/{b.rocks.length}</span>
                    </div>
                    {b.rocks.length > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Open To-Dos</span>
                      <span className="font-medium">{b.todos.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Meeting</span>
                      <span className="font-medium">
                        {lastMeeting
                          ? new Date(lastMeeting.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    {b.owners.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {b.owners.slice(0, 3).map((o) => (
                          <span
                            key={o.id}
                            className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium"
                          >
                            {o.user.name}
                          </span>
                        ))}
                        {b.owners.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{b.owners.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent portfolio meetings */}
      {portfolioMeetings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Portfolio Meetings</h2>
            <Link href={`/${APOTHO_SLUG}/meetings`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {portfolioMeetings.map((m) => (
              <Link key={m.id} href={`/${APOTHO_SLUG}/meetings/${m.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(m.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.endedAt ? "Completed" : "In progress"}
                      </p>
                    </div>
                    {m.avgRating !== null && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                        {m.avgRating.toFixed(1)}/10
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cross-portfolio open todos */}
      {crossPortfolioTodos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Open Cross-Portfolio To-Dos</h2>
            <Link href={`/${APOTHO_SLUG}/todos`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {crossPortfolioTodos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <CheckSquareIcon className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.owner.name} ·{" "}
                    <Link href={`/${t.business.slug}`} className="hover:underline">
                      {t.business.name}
                    </Link>
                    {t.dueDate ? ` · Due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live portfolio financial snapshot */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Portfolio Financial Snapshot</h2>
        <FinancialsDashboard slug={APOTHO_SLUG} autoload />
      </div>
    </div>
  );
}

// ─── Small bits ───────────────────────────────────────────────────────────────

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        {icon}
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function NavCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
