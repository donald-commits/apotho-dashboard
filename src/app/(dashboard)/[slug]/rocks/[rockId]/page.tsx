import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CheckCircleIcon, CircleIcon, UserIcon, TargetIcon, CalendarIcon, MessageSquareIcon, MilestoneIcon, BarChart3Icon } from "lucide-react";
import { RockTodoList } from "@/components/rocks/rock-todo-list";
import { RockDetailsForm } from "@/components/rocks/rock-details-form";
import { RockNotes } from "@/components/rocks/rock-notes";
import { RockMilestones } from "@/components/rocks/rock-milestones";
import { GanttChart } from "@/components/rocks/gantt-chart";

export default async function RockDetailPage({
  params,
}: {
  params: { slug: string; rockId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound();

  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
  });
  if (!business) return notFound();

  const rock = await prisma.rock.findUnique({
    where: { id: params.rockId },
    include: {
      owner: true,
      integrator: true,
      todos: {
        include: { owner: true },
        orderBy: { createdAt: "asc" },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      milestones: {
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!rock || rock.businessId !== business.id) return notFound();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const completedTodos = rock.todos.filter((t) => t.done).length;
  const totalTodos = rock.todos.length;
  const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const targetDateStr = rock.targetCompletionDate
    ? rock.targetCompletionDate.toISOString().split("T")[0]
    : null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${params.slug}/rocks`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight gradient-text flex items-center gap-2">
            {rock.done ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <CircleIcon className="h-6 w-6 text-muted-foreground" />
            )}
            {rock.title}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" /> Owner: {rock.owner.name}
            </span>
            {rock.integrator && (
              <span className="flex items-center gap-1">
                <TargetIcon className="h-3.5 w-3.5" /> Integrator: {rock.integrator.name}
              </span>
            )}
            <span>Q{rock.quarter} {rock.year} &middot; {business.name}</span>
          </div>
        </div>
      </div>

      {/* Status & Target Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Status & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RockDetailsForm
            rockId={rock.id}
            initialStatus={rock.status}
            initialTargetDate={targetDateStr}
          />
        </CardContent>
      </Card>

      {rock.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{rock.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" /> Gantt Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GanttChart
            milestones={rock.milestones.map((m) => ({
              id: m.id,
              title: m.title,
              startDate: m.startDate.toISOString(),
              endDate: m.endDate.toISOString(),
              done: m.done,
            }))}
            targetCompletionDate={targetDateStr}
          />
          {rock.milestones.length === 0 && (
            <p className="text-sm text-muted-foreground">Add milestones below to see the Gantt timeline.</p>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MilestoneIcon className="h-4 w-4" /> Milestones
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Key dates and deliverables to track progress toward completion
          </p>
        </CardHeader>
        <CardContent>
          <RockMilestones
            rockId={rock.id}
            milestones={rock.milestones.map((m) => ({
              id: m.id,
              title: m.title,
              startDate: m.startDate.toISOString().split("T")[0],
              endDate: m.endDate.toISOString().split("T")[0],
              done: m.done,
            }))}
          />
        </CardContent>
      </Card>

      {/* Notes / Current Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquareIcon className="h-4 w-4" /> Notes & Current Actions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track what actions are being taken to complete this rock
          </p>
        </CardHeader>
        <CardContent>
          <RockNotes
            rockId={rock.id}
            notes={rock.notes.map((n) => ({
              id: n.id,
              content: n.content,
              authorName: n.author.name,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      {/* To-Dos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">To-Dos for this Rock</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedTodos}/{totalTodos} completed
              {totalTodos > 0 && ` (${progress}%)`}
            </p>
          </div>
          {totalTodos > 0 && (
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <RockTodoList
            todos={rock.todos.map((t) => ({
              id: t.id,
              title: t.title,
              done: t.done,
              ownerName: t.owner.name,
              dueDate: t.dueDate?.toISOString() || null,
            }))}
            rockId={rock.id}
            businessId={business.id}
            users={users.map((u) => ({ id: u.id, name: u.name }))}
            currentUserId={session.user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
