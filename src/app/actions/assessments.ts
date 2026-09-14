"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  parseBilateral,
  parseBloodPressure,
  parseDuration,
  parseRepeatedMeasure,
  firstNumber,
} from "@/lib/parse";

/**
 * Derives the chartable number from whatever the coach typed, using the
 * metric's own semantics. The raw text is always kept: the shorthand carries
 * context ("on blue foam", "assisted") the number cannot.
 */
function deriveNumbers(
  metricKey: string,
  valueType: string,
  raw: string,
): { numericValue: number | null; secondaryValue: number | null } {
  if (metricKey === "BLOOD_PRESSURE" || metricKey === "POST_TEST_BP") {
    const bp = parseBloodPressure(raw);
    return {
      numericValue: bp?.systolic ?? null,
      secondaryValue: bp?.diastolic ?? null,
    };
  }

  switch (valueType) {
    case "BILATERAL": {
      const { right, left } = parseBilateral(raw, {
        asSeconds: metricKey === "SINGLE_LEG_STAND",
      });
      return { numericValue: right, secondaryValue: left };
    }
    case "DURATION":
      return { numericValue: parseDuration(raw), secondaryValue: null };
    case "NUMBER":
      return { numericValue: parseRepeatedMeasure(raw), secondaryValue: null };
    default:
      return { numericValue: firstNumber(raw), secondaryValue: null };
  }
}

const saveSchema = z.object({
  clientId: z.string().min(1),
  assessmentId: z.string().nullable(),
  date: z.string().min(1),
  label: z.string().max(80).nullable(),
  notes: z.string().max(4000).nullable(),
  values: z.record(z.string(), z.string()),
});

export async function saveAssessment(input: unknown) {
  const { clientId, assessmentId, date, label, notes, values } =
    saveSchema.parse(input);

  const metrics = await prisma.assessmentMetric.findMany();
  const byKey = new Map(metrics.map((m) => [m.key, m]));

  const entries = Object.entries(values)
    .map(([key, raw]) => {
      const metric = byKey.get(key);
      const text = raw.trim();
      if (!metric || !text) return null;
      const { numericValue, secondaryValue } = deriveNumbers(
        metric.key,
        metric.valueType,
        text,
      );
      return {
        metricId: metric.id,
        rawValue: text,
        numericValue,
        secondaryValue,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (assessmentId) {
    await prisma.$transaction([
      prisma.assessmentValue.deleteMany({ where: { assessmentId } }),
      prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          date: parsedDate,
          label,
          notes,
          values: { create: entries },
        },
      }),
    ]);
  } else {
    const existing = await prisma.assessment.count({ where: { clientId } });
    await prisma.assessment.create({
      data: {
        clientId,
        date: parsedDate,
        label: label ?? (existing === 0 ? "Initial Eval" : `Eval ${existing + 1}`),
        isInitial: existing === 0,
        notes,
        values: { create: entries },
      },
    });
  }

  revalidatePath(`/clients/${clientId}/assessments`);
  revalidatePath(`/clients/${clientId}/progress`);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteAssessment(assessmentId: string) {
  const assessment = await prisma.assessment.delete({
    where: { id: assessmentId },
    select: { clientId: true },
  });

  revalidatePath(`/clients/${assessment.clientId}/assessments`);
  revalidatePath(`/clients/${assessment.clientId}/progress`);
}
