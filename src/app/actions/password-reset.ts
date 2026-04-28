"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function requestPasswordReset(email: string) {
  if (!email?.trim()) return { error: "Email is required." };

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Always return success to avoid leaking whether the email exists
  if (!user) return { success: true };

  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // Generate a secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  await sendPasswordResetEmail(email, token);

  return { success: true };
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  if (!email || !token || !newPassword) {
    return { error: "Missing required fields." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record) {
    return { error: "Invalid or expired reset link." };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });
    return { error: "This reset link has expired. Please request a new one." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Account not found." };
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword: hashed },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  });

  return { success: true };
}
