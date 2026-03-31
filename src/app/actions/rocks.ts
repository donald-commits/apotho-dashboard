"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createRock(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const businessId = formData.get("businessId") as string;
  const quarter = parseInt(formData.get("quarter") as string, 10);
  const year = parseInt(formData.get("year") as string, 10);
  const ownerId = (formData.get("ownerId") as string) || session.user.id;

  if (!title || !businessId || !quarter || !year) throw new Error("Missing required fields");

  await prisma.rock.create({
    data: { title, description: description || null, businessId, ownerId, quarter, year },
  });

  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (biz) revalidatePath(`/${biz.slug}/rocks`);
  revalidatePath("/my-rocks");
}

export async function toggleRock(rockId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rock = await prisma.rock.findUnique({ where: { id: rockId }, include: { business: true } });
  if (!rock) throw new Error("Rock not found");

  await prisma.rock.update({ where: { id: rockId }, data: { done: !rock.done } });

  revalidatePath(`/${rock.business.slug}/rocks`);
  revalidatePath("/my-rocks");
}

export async function deleteRock(rockId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rock = await prisma.rock.findUnique({ where: { id: rockId }, include: { business: true } });
  if (!rock) throw new Error("Rock not found");

  await prisma.rock.delete({ where: { id: rockId } });

  revalidatePath(`/${rock.business.slug}/rocks`);
  revalidatePath("/my-rocks");
}
