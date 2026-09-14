"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePerformedSets, parseSetCount } from "@/lib/parse";

const setSchema = z.object({
  load: z.number().nullable(),
  reps: z.number().int().nullable(),
});

const logSetsSchema = z.object({
  sessionItemId: z.string().min(1),
  sets: z.array(setSchema).max(20),
  notes: z.string().max(2000).nullable(),
});

export async function logPerformedSets(input: unknown) {
  await requireUser();
  const { sessionItemId, sets, notes } = logSetsSchema.parse(input);

  const item = await prisma.sessionItem.findUnique({
    where: { id: sessionItemId },
    select: { sessionId: true, session: { select: { clientId: true } } },
  });
  if (!item) throw new Error("Session item not found");

  // Sets are replaced wholesale: the coach edits the row, not individual sets.
  const meaningful = sets.filter((s) => s.load !== null || s.reps !== null);

  await prisma.$transaction([
    prisma.performedSet.deleteMany({ where: { sessionItemId } }),
    prisma.sessionItem.update({
      where: { id: sessionItemId },
      data: {
        notes,
        performedRaw: meaningful
          .map((s) => (s.load !== null ? String(s.load) : "—"))
          .join(","),
        sets: {
          create: meaningful.map((set, index) => ({
            setNumber: index + 1,
            load: set.load,
            loadRaw: set.load !== null ? String(set.load) : null,
            reps: set.reps,
          })),
        },
      },
    }),
  ]);

  // A session with any logged work is no longer merely planned.
  if (meaningful.length > 0) {
    await prisma.session.update({
      where: { id: item.sessionId },
      data: { status: "COMPLETED" },
    });
  }

  revalidatePath(`/clients/${item.session.clientId}/sessions/${item.sessionId}`);
  revalidatePath(`/clients/${item.session.clientId}`);
}

const vitalsSchema = z.object({
  sessionId: z.string().min(1),
  bpPreSystolic: z.number().int().nullable(),
  bpPreDiastolic: z.number().int().nullable(),
  bpPostSystolic: z.number().int().nullable(),
  bpPostDiastolic: z.number().int().nullable(),
  bodyweight: z.number().nullable(),
  sessionRpe: z.number().nullable(),
  notes: z.string().max(4000).nullable(),
});

export async function updateSessionVitals(input: unknown) {
  await requireUser();
  const { sessionId, ...data } = vitalsSchema.parse(input);

  const session = await prisma.session.update({
    where: { id: sessionId },
    data,
    select: { clientId: true },
  });

  revalidatePath(`/clients/${session.clientId}/sessions/${sessionId}`);
  revalidatePath(`/clients/${session.clientId}`);
}

const createSessionSchema = z.object({
  clientId: z.string().min(1),
  date: z.string().min(1),
  dayType: z.enum(["STRENGTH", "MOVEMENT"]),
  templateId: z.string().nullable(),
});

export async function createSession(input: unknown) {
  await requireUser();
  const { clientId, date, dayType, templateId } =
    createSessionSchema.parse(input);

  const template = templateId
    ? await prisma.sessionTemplate.findUnique({
        where: { id: templateId },
        include: { items: { orderBy: { order: "asc" } } },
      })
    : null;

  const session = await prisma.session.create({
    data: {
      clientId,
      date: new Date(`${date}T00:00:00.000Z`),
      dayType,
      templateId: template?.id ?? null,
      items: template
        ? {
            create: template.items.map((item) => ({
              order: item.order,
              blockId: item.blockId,
              exerciseId: item.exerciseId,
              groupLabel: item.groupLabel,
              prescribedSets: item.prescribedSets,
              prescribedReps: item.prescribedReps,
              prescribedLoad: item.prescribedLoad,
              tempo: item.tempo,
              cues: item.cues,
              target: item.target,
            })),
          }
        : undefined,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  return session.id;
}

const copySchema = z.object({
  sourceSessionId: z.string().min(1),
  clientId: z.string().min(1),
  date: z.string().min(1),
  keepExercises: z.boolean(),
});

/**
 * Repeats a session's block sequence on a new date. The slot order is the part
 * of the programme that persists week to week; `keepExercises` controls whether
 * the exercises carry over or the slots are left open for fresh selection.
 */
export async function copySession(input: unknown) {
  await requireUser();
  const { sourceSessionId, clientId, date, keepExercises } =
    copySchema.parse(input);

  const source = await prisma.session.findUnique({
    where: { id: sourceSessionId },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!source) throw new Error("Session not found");

  const session = await prisma.session.create({
    data: {
      clientId,
      date: new Date(`${date}T00:00:00.000Z`),
      dayType: source.dayType,
      templateId: source.templateId,
      items: {
        create: source.items.map((item) => ({
          order: item.order,
          blockId: item.blockId,
          exerciseId: keepExercises ? item.exerciseId : null,
          exerciseLabel: keepExercises ? item.exerciseLabel : null,
          groupLabel: item.groupLabel,
          prescribedSets: item.prescribedSets,
          prescribedReps: item.prescribedReps,
          prescribedLoad: keepExercises ? item.prescribedLoad : null,
          tempo: item.tempo,
          cues: item.cues,
          target: item.target,
        })),
      },
    },
  });

  revalidatePath(`/clients/${clientId}`);
  return session.id;
}

const addItemSchema = z.object({
  sessionId: z.string().min(1),
  blockId: z.string().min(1),
  exerciseId: z.string().nullable(),
  exerciseLabel: z.string().max(200).nullable(),
  prescribedSets: z.string().max(40).nullable(),
  prescribedReps: z.string().max(80).nullable(),
  prescribedLoad: z.string().max(120).nullable(),
  tempo: z.string().max(120).nullable(),
  cues: z.string().max(500).nullable(),
  groupLabel: z.string().max(10).nullable(),
});

export async function addSessionItem(input: unknown) {
  await requireUser();
  const data = addItemSchema.parse(input);

  const last = await prisma.sessionItem.findFirst({
    where: { sessionId: data.sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const session = await prisma.sessionItem.create({
    data: { ...data, order: (last?.order ?? -1) + 1 },
    select: { session: { select: { clientId: true, id: true } } },
  });

  revalidatePath(
    `/clients/${session.session.clientId}/sessions/${session.session.id}`,
  );
}

export async function deleteSessionItem(sessionItemId: string) {
  await requireUser();
  const item = await prisma.sessionItem.delete({
    where: { id: sessionItemId },
    select: { sessionId: true, session: { select: { clientId: true } } },
  });

  revalidatePath(`/clients/${item.session.clientId}/sessions/${item.sessionId}`);
}

/**
 * Accepts the coach's own shorthand ("77,88,88") rather than forcing one input
 * per set, since that is how the work gets written down mid-session.
 */
export async function logSetsFromShorthand(
  sessionItemId: string,
  shorthand: string,
) {
  await requireUser();
  const item = await prisma.sessionItem.findUnique({
    where: { id: sessionItemId },
    select: { prescribedSets: true },
  });
  if (!item) throw new Error("Session item not found");

  const parsed = parsePerformedSets(
    shorthand,
    parseSetCount(item.prescribedSets),
  );

  await logPerformedSets({
    sessionItemId,
    sets: parsed.map((s) => ({ load: s.load, reps: null })),
    notes: null,
  });
}
