import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TodoToggle } from "@/components/todos/todo-toggle";
import { AddTodoForm } from "@/components/todos/add-todo-form";
import { ChevronLeftIcon } from "lucide-react";

interface PageProps {
  params: { slug: string };
  searchParams: { filter?: "open" | "done" | "all" };
}

export default async function BusinessTodosPage({ params, searchParams }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
    include: { owners: { include: { user: true } } },
  });

  if (!business) notFound();

  const filter = searchParams.filter ?? "open";

  const todos = await prisma.todo.findMany({
    where: {
      businessId: business.id,
      ...(filter === "open" ? { done: false } : filter === "done" ? { done: true } : {}),
    },
    include: { owner: true },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
  });

  const owners = business.owners.map((o) => ({ id: o.user.id, name: o.user.name }));

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
        <h1 className="text-3xl font-bold tracking-tight gradient-text">To-Dos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {todos.filter((t) => !t.done).length} open items
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["open", "done", "all"] as const).map((f) => (
          <Link
            key={f}
            href={`/${params.slug}/todos?filter=${f}`}
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border capitalize transition-colors ${
              f === filter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {/* Todo list */}
      <div className="flex flex-col gap-2">
        {todos.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No to-dos found.</p>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              todo.done ? "bg-muted/50 opacity-70" : "bg-card"
            }`}
          >
            <TodoToggle todoId={todo.id} done={todo.done} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${todo.done ? "line-through text-muted-foreground" : ""}`}>
                {todo.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{todo.owner.name}</p>
            </div>
            {todo.dueDate && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>

      <AddTodoForm businessId={business.id} owners={owners} />
    </div>
  );
}
