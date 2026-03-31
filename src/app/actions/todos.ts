"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTodo(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const businessId = formData.get("businessId") as string;
  const dueDateStr = formData.get("dueDate") as string | null;
  const ownerId = (formData.get("ownerId") as string) || session.user.id;
  const meetingId = (formData.get("meetingId") as string) || null;

  if (!title || !businessId) throw new Error("Missing required fields");

  const dueDate = dueDateStr ? new Date(dueDateStr) : null;

  await prisma.todo.create({
    data: { title, businessId, ownerId, dueDate, meetingId },
  });

  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (biz) revalidatePath(`/${biz.slug}/todos`);
  revalidatePath("/my-todos");
}

export async function toggleTodo(todoId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const todo = await prisma.todo.findUnique({ where: { id: todoId }, include: { business: true } });
  if (!todo) throw new Error("Todo not found");

  await prisma.todo.update({ where: { id: todoId }, data: { done: !todo.done } });

  revalidatePath(`/${todo.business.slug}/todos`);
  revalidatePath("/my-todos");
}

export async function deleteTodo(todoId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const todo = await prisma.todo.findUnique({ where: { id: todoId }, include: { business: true } });
  if (!todo) throw new Error("Todo not found");

  await prisma.todo.delete({ where: { id: todoId } });

  revalidatePath(`/${todo.business.slug}/todos`);
  revalidatePath("/my-todos");
}
