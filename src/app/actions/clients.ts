"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";

const clientSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80),
  email: z.string().email().nullable().or(z.literal("")),
  phone: z.string().max(40).nullable(),
  goals: z.string().max(2000).nullable(),
  medicalNotes: z.string().max(4000).nullable(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]),
});

export async function createClient(formData: FormData) {
  const parsed = clientSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    goals: formData.get("goals") || null,
    medicalNotes: formData.get("medicalNotes") || null,
    status: formData.get("status") ?? "ACTIVE",
  });

  const client = await prisma.client.create({
    data: {
      ...parsed,
      email: parsed.email || null,
      startedOn: new Date(),
    },
  });

  revalidatePath("/");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  const parsed = clientSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    goals: formData.get("goals") || null,
    medicalNotes: formData.get("medicalNotes") || null,
    status: formData.get("status") ?? "ACTIVE",
  });

  await prisma.client.update({
    where: { id: clientId },
    data: { ...parsed, email: parsed.email || null },
  });

  revalidatePath("/");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
