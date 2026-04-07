import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TodoToggle } from "@/components/todos/todo-toggle";

interface SearchParams {
  filter?: string;
}

export default async function MyTodosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const filter = searchParams.filter ?? "open";

  const todos = await prisma.todo.findMany({
    where: {
      ownerId: session.user.id,
      ...(filter === "open" ? { done: false } : filter === "done" ? { done: true } : {}),
    },
    include: { business: true },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  // Group by business
  const byBusiness = todos.reduce<Record<string, typeof todos>>((acc, todo) => {
    const key = todo.business.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(todo);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight gradient-text">My To-Dos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {todos.filter((t) => !t.done).length} open items across all businesses
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["open", "done", "all"] as const).map((f) => (
          <Link
            key={f}
            href={`/my-todos?filter=${f}`}
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

      {todos.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">No to-dos found.</p>
      )}

      {Object.entries(byBusiness).map(([bizName, bizTodos]) => (
        <div key={bizName}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {bizName}
          </h2>
          <div className="flex flex-col gap-2">
            {bizTodos.map((todo) => (
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
                </div>
                {todo.dueDate && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
