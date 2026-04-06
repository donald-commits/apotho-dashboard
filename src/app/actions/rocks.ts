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

export async function updateRockDetails(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rockId = formData.get("rockId") as string;
  const targetCompletionDate = formData.get("targetCompletionDate") as string | null;
  const status = formData.get("status") as string;

  const rock = await prisma.rock.findUnique({ where: { id: rockId }, include: { business: true } });
  if (!rock) throw new Error("Rock not found");

  await prisma.rock.update({
    where: { id: rockId },
    data: {
      targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : null,
      status: status || rock.status,
    },
  });

  revalidatePath(`/${rock.business.slug}/rocks/${rockId}`);
  revalidatePath(`/${rock.business.slug}/rocks`);
  revalidatePath("/my-rocks");
}

export async function addRockNote(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rockId = formData.get("rockId") as string;
  const content = formData.get("content") as string;
  if (!content?.trim()) throw new Error("Note content required");

  const rock = await prisma.rock.findUnique({ where: { id: rockId }, include: { business: true } });
  if (!rock) throw new Error("Rock not found");

  await prisma.rockNote.create({
    data: { rockId, authorId: session.user.id, content: content.trim() },
  });

  revalidatePath(`/${rock.business.slug}/rocks/${rockId}`);
}

export async function deleteRockNote(noteId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const note = await prisma.rockNote.findUnique({
    where: { id: noteId },
    include: { rock: { include: { business: true } } },
  });
  if (!note) throw new Error("Note not found");

  await prisma.rockNote.delete({ where: { id: noteId } });
  revalidatePath(`/${note.rock.business.slug}/rocks/${note.rockId}`);
}

export async function addRockMilestone(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rockId = formData.get("rockId") as string;
  const title = formData.get("title") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!title?.trim() || !startDate || !endDate) throw new Error("Missing fields");

  const rock = await prisma.rock.findUnique({ where: { id: rockId }, include: { business: true } });
  if (!rock) throw new Error("Rock not found");

  await prisma.rockMilestone.create({
    data: {
      rockId,
      title: title.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath(`/${rock.business.slug}/rocks/${rockId}`);
}

export async function toggleRockMilestone(milestoneId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const milestone = await prisma.rockMilestone.findUnique({
    where: { id: milestoneId },
    include: { rock: { include: { business: true } } },
  });
  if (!milestone) throw new Error("Milestone not found");

  await prisma.rockMilestone.update({
    where: { id: milestoneId },
    data: { done: !milestone.done },
  });

  revalidatePath(`/${milestone.rock.business.slug}/rocks/${milestone.rockId}`);
}

export async function deleteRockMilestone(milestoneId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const milestone = await prisma.rockMilestone.findUnique({
    where: { id: milestoneId },
    include: { rock: { include: { business: true } } },
  });
  if (!milestone) throw new Error("Milestone not found");

  await prisma.rockMilestone.delete({ where: { id: milestoneId } });
  revalidatePath(`/${milestone.rock.business.slug}/rocks/${milestone.rockId}`);
}
