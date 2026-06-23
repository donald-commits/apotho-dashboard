"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function startMeeting(businessId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meeting = await prisma.meeting.create({
    data: { businessId, startedAt: new Date(), date: new Date() },
  });

  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (biz) revalidatePath(`/${biz.slug}/meetings`);

  return meeting.id;
}

export async function endMeeting(meetingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { ratings: true, business: true, todos: { include: { owner: true } } },
  });
  if (!meeting) throw new Error("Meeting not found");

  const avg =
    meeting.ratings.length > 0
      ? meeting.ratings.reduce((sum, r) => sum + r.rating, 0) / meeting.ratings.length
      : null;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { endedAt: new Date(), avgRating: avg },
  });

  // Send each person an email with their to-dos
  const todosByOwner = new Map<string, { name: string; email: string; todos: string[] }>();
  for (const todo of meeting.todos) {
    if (!todosByOwner.has(todo.ownerId)) {
      todosByOwner.set(todo.ownerId, { name: todo.owner.name, email: todo.owner.email, todos: [] });
    }
    todosByOwner.get(todo.ownerId)!.todos.push(todo.title);
  }

  const dateStr = meeting.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Create in-app notifications for each person with their to-dos
  const ownerEntries = Array.from(todosByOwner.entries());
  for (const [userId, { todos }] of ownerEntries) {
    const todoList = todos.map((t) => `• ${t}`).join("\n");
    await prisma.notification.create({
      data: {
        userId,
        type: "todo-assigned",
        title: `Your To-Dos — ${meeting.business.name} Meeting`,
        body: `From ${dateStr}:\n${todoList}`,
        href: `/${meeting.business.slug}/meetings/${meetingId}`,
      },
    });
  }

  // Send emails via Gmail SMTP
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    for (const entry of Array.from(todosByOwner.values())) {
      const { name, email, todos } = entry;
      const todoListHtml = todos.map((t) => `<li>${t}</li>`).join("");
      transporter.sendMail({
        from: `"Apotho Dashboard" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Your To-Dos — ${meeting.business.name} Meeting (${dateStr})`,
        html: `<p>Hi ${name},</p><p>Here are your to-dos from the <strong>${meeting.business.name}</strong> Level 10 Meeting on ${dateStr}:</p><ul>${todoListHtml}</ul><p>Please complete these by next week's meeting.</p><p>— Apotho Dashboard</p>`,
      }).catch(() => {});
    }
  } catch {
    // Silently fail — email is best-effort
  }

  revalidatePath(`/${meeting.business.slug}/meetings`);
}

export async function saveSegue(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meetingId = formData.get("meetingId") as string;
  const userId = formData.get("userId") as string;
  const personal = formData.get("personal") as string;
  const professional = formData.get("professional") as string;

  if (!meetingId || !userId) throw new Error("Missing required fields");

  const existing = await prisma.meetingSegue.findFirst({ where: { meetingId, userId } });
  if (existing) {
    await prisma.meetingSegue.update({
      where: { id: existing.id },
      data: { personal, professional },
    });
  } else {
    await prisma.meetingSegue.create({ data: { meetingId, userId, personal, professional } });
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { business: true } });
  if (meeting) revalidatePath(`/${meeting.business.slug}/meetings/${meetingId}`);
}

export async function addIssue(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meetingId = formData.get("meetingId") as string;
  const title = formData.get("title") as string;

  if (!meetingId || !title) throw new Error("Missing required fields");

  await prisma.meetingIssue.create({ data: { meetingId, title } });

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { business: true } });
  if (meeting) revalidatePath(`/${meeting.business.slug}/meetings/${meetingId}`);
}

export async function resolveIssue(issueId: string, notes: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const issue = await prisma.meetingIssue.findUnique({
    where: { id: issueId },
    include: { meeting: { include: { business: true } } },
  });
  if (!issue) throw new Error("Issue not found");

  await prisma.meetingIssue.update({ where: { id: issueId }, data: { resolved: true, notes } });

  revalidatePath(`/${issue.meeting.business.slug}/meetings/${issue.meetingId}`);
}

export async function saveRating(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const meetingId = formData.get("meetingId") as string;
  const userId = formData.get("userId") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const reason = (formData.get("reason") as string) || null;

  if (!meetingId || !userId || !rating) throw new Error("Missing required fields");

  const existing = await prisma.meetingRating.findFirst({ where: { meetingId, userId } });
  if (existing) {
    await prisma.meetingRating.update({ where: { id: existing.id }, data: { rating, reason } });
  } else {
    await prisma.meetingRating.create({ data: { meetingId, userId, rating, reason } });
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { business: true } });
  if (meeting) revalidatePath(`/${meeting.business.slug}/meetings/${meetingId}`);
}
