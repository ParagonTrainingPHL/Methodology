"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/auth";

/**
 * True only until the first account exists. Setup is a one-time door: once it
 * has been used, it is closed permanently rather than guarded by a password.
 */
export async function needsSetup(): Promise<boolean> {
  return (await prisma.user.count()) === 0;
}

const setupSchema = z
  .object({
    name: z.string().min(1, "Enter your name.").max(80),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(10, "Use at least 10 characters."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "The two passwords do not match.",
    path: ["confirm"],
  });

export async function completeSetup(_state: unknown, formData: FormData) {
  // Re-checked here, not just in the page: this action is reachable directly.
  if (!(await needsSetup())) {
    return { error: "An account already exists. Sign in instead." };
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: "COACH",
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
