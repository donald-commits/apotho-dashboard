import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, CheckCircleIcon, CircleIcon } from "lucide-react";
import { RockTodoList } from "@/components/rocks/rock-todo-list";

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
      todos: {
        include: { owner: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!rock || rock.businessId !== business.id) return notFound();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  const completedTodos = rock.todos.filter((t) => t.done).length;
  const totalTodos = rock.todos.length;
  const progress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/${params.slug}/rocks`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {rock.done ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            ) : (
              <CircleIcon className="h-6 w-6 text-muted-foreground" />
            )}
            {rock.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Owner: {rock.owner.name} &middot; Q{rock.quarter} {rock.year} &middot; {business.name}
          </p>
        </div>
      </div>

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
