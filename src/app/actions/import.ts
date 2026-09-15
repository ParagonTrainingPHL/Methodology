"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  importTrackerWorkbook,
  type ImportSummary,
} from "@/lib/import-tracker";

const MAX_BYTES = 15 * 1024 * 1024;

const SPREADSHEET_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
]);

export type ImportResult =
  | { ok: true; summary: ImportSummary; replaced: number }
  | { ok: false; error: string };

export async function importUploadedWorkbook(
  _state: unknown,
  formData: FormData,
): Promise<ImportResult> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a spreadsheet file to upload." };
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 15 MB.`,
    };
  }

  if (!SPREADSHEET_TYPES.has(file.type) && !file.name.endsWith(".xlsx")) {
    return {
      ok: false,
      error: "That does not look like an .xlsx file. Export from Excel or Google Sheets as .xlsx and try again.",
    };
  }

  // Replacing is the default: re-uploading the same workbook should refresh the
  // data rather than create a second copy of every client.
  const replace = formData.get("replace") === "on";
  const replaced = replace ? await prisma.client.count() : 0;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const summary = await importTrackerWorkbook(buffer, { reset: replace });

    revalidatePath("/");
    revalidatePath("/library");

    return { ok: true, summary, replaced };
  } catch (error) {
    // The workbook is the user's own file and may be shaped unexpectedly; say
    // so plainly rather than surfacing a parser stack trace.
    const detail = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      error: `That file could not be read: ${detail}`,
    };
  }
}
