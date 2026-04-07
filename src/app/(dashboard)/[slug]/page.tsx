import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TargetIcon, CheckSquareIcon, CalendarIcon, BarChart2Icon, DollarSignIcon } from "lucide-react";

interface PageProps {
  params: { slug: string };
}

export default async function BusinessPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: {
      owners: { include: { user: true } },
      rocks: { where: { done: false }, take: 5, orderBy: { createdAt: "desc" } },
      todos: { where: { done: false }, take: 5, orderBy: { createdAt: "desc" } },
      meetings: { take: 3, orderBy: { date: "desc" } },
    },
  });

  if (!business) notFound();

  const sections = [
    {
      label: "Rocks",
      href: `/${business.slug}/rocks`,
      icon: TargetIcon,
      count: business.rocks.length,
      description: "Q1 2026 priorities",
    },
    {
      label: "To-Dos",
      href: `/${business.slug}/todos`,
      icon: CheckSquareIcon,
      count: business.todos.length,
      description: "Open action items",
    },
    {
      label: "Meetings",
      href: `/${business.slug}/meetings`,
      icon: CalendarIcon,
      count: business.meetings.length,
      description: "Level 10 meeting history",
    },
    {
      label: "Scorecard",
      href: `/${business.slug}/scorecard`,
      icon: BarChart2Icon,
      count: null,
      description: "Weekly KPIs & measurables",
    },
    {
      label: "Financials",
      href: `/${business.slug}/financials`,
      icon: DollarSignIcon,
      count: null,
      description: "Revenue & expense overview",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">{business.name}</h1>
        {business.description && (
          <p className="text-sm text-muted-foreground mt-1">{business.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {business.owners.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
            >
              {o.user.name}
            </span>
          ))}
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="cursor-pointer card-interactive h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  {s.count !== null && (
                    <span className="text-xs text-muted-foreground">{s.count} open</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Open Rocks preview */}
      {business.rocks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Open Rocks (Q1 2026)</h2>
            <Link href={`/${business.slug}/rocks`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {business.rocks.map((rock) => (
              <div key={rock.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                <span className="text-sm">{rock.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Todos preview */}
      {business.todos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Open To-Dos</h2>
            <Link href={`/${business.slug}/todos`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {business.todos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-sm">{todo.title}</span>
                {todo.dueDate && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Due {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
