/**
 * Imports a "Training and Progress Tracker" workbook into the database.
 *
 * The workbook pairs each client with two sheets: a dated workout log and an
 * "<name> RE" re-evaluation sheet. Sessions in the log are delimited by repeated
 * header rows, and the header wording identifies which of the two day templates
 * the session follows.
 *
 * Usage: npm run import:xlsx -- <path-to-xlsx> [--reset]
 */

import ExcelJS from "exceljs";
import { PrismaClient } from "../src/generated/prisma";
import {
  cleanCell,
  firstNumber,
  isBodyweightLoad,
  isOpenChoiceExercise,
  looksLikePerSetLog,
  normalizeName,
  parseBilateral,
  parseBloodPressure,
  parseDuration,
  parsePerformedSets,
  parseRepeatedMeasure,
  parseRepList,
  parseSetCount,
  isPostReading,
} from "../src/lib/parse";
import { ASSESSMENT_METRICS } from "../src/lib/constants";
import { suggestBlockKey } from "../src/lib/classify";

const prisma = new PrismaClient();

type Row = (unknown | null)[];

/** ExcelJS hands back rich text and formula objects; flatten to a primitive. */
function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    const obj = value as unknown as Record<string, unknown>;
    if ("richText" in obj && Array.isArray(obj.richText)) {
      return obj.richText.map((r) => (r as { text: string }).text).join("");
    }
    if ("result" in obj) return obj.result;
    if ("text" in obj) return obj.text;
    if ("hyperlink" in obj) return obj.text ?? null;
    return null;
  }
  return value;
}

function readSheet(sheet: ExcelJS.Worksheet, width: number): Row[] {
  const rows: Row[] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values: Row = [];
    for (let c = 1; c <= width; c += 1) {
      values.push(cellValue(row.getCell(c)));
    }
    rows[rowNumber - 1] = values;
  });
  for (let i = 0; i < rows.length; i += 1) {
    if (!rows[i]) rows[i] = new Array(width).fill(null);
  }
  return rows;
}

function isHeaderRow(row: Row): boolean {
  const first = cleanCell(row[0])?.toLowerCase();
  return first === "date" || first === "phase";
}

/**
 * Which of the two column layouts the rows below a header use.
 *
 * "CUED" headers label column G "Coaching Cues" and column H a target;
 * "LOGGED" headers label them "tempo" and a performed-weight column. The header
 * names its own columns, so this is reliable — unlike the day type, which the
 * header wording stopped tracking once the coach settled on one layout.
 */
function layoutFromHeader(row: Row): "CUED" | "LOGGED" {
  const first = cleanCell(row[0])?.toLowerCase();
  const seventh = cleanCell(row[6])?.toLowerCase();
  if (first === "phase" || seventh === "coaching cues") return "CUED";
  return "LOGGED";
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  return null;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Client name handling
// ---------------------------------------------------------------------------

function splitName(sheetName: string): { firstName: string; lastName: string } {
  const parts = sheetName.trim().split(/\s+/);
  const firstName = parts[0] ?? sheetName;
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/**
 * RE sheets abbreviate surnames ("Patrick D RE" for "Patrick Devine"), so match
 * on first name plus the leading character of the surname.
 */
function namesMatch(a: string, b: string): boolean {
  const left = splitName(a);
  const right = splitName(b);
  if (left.firstName.toLowerCase() !== right.firstName.toLowerCase()) return false;
  if (!left.lastName || !right.lastName) return true;
  return (
    left.lastName[0].toLowerCase() === right.lastName[0].toLowerCase()
  );
}

// ---------------------------------------------------------------------------
// Lookup caches
// ---------------------------------------------------------------------------

const blockCache = new Map<string, string>();
let fallbackBlockId = "";

async function loadBlocks() {
  const aliases = await prisma.blockAlias.findMany();
  for (const alias of aliases) blockCache.set(alias.raw, alias.blockId);
  const blocks = await prisma.block.findMany();
  for (const block of blocks) {
    blockCache.set(normalizeName(block.name), block.id);
    blockCache.set(block.key.toLowerCase(), block.id);
  }
  for (const block of blocks) {
    if (block.category === "STRENGTH") strengthBlockIds.add(block.id);
  }

  const fallback = blocks.find((b) => b.key === "UNSPECIFIED");
  if (!fallback) throw new Error("Run the seed before importing.");
  fallbackBlockId = fallback.id;
}

/**
 * Superset markers ("1A", "2B") appear in the block column, sometimes appended
 * to a real block name like "Upper Pull 1 A".
 */
function extractGroupLabel(raw: string): { block: string | null; groupLabel: string | null } {
  const match = raw.match(/\b(\d)\s*([AB])\b\s*$/i);
  if (!match) return { block: raw, groupLabel: null };
  const groupLabel = `${match[1]}${match[2].toUpperCase()}`;
  const block = raw.slice(0, match.index).trim();
  // A bare "1A" is only a superset marker; there is no block name to resolve.
  return { block: block || null, groupLabel };
}

async function resolveBlock(raw: string | null): Promise<{ blockId: string; groupLabel: string | null }> {
  if (!raw) return { blockId: fallbackBlockId, groupLabel: null };

  const { block, groupLabel } = extractGroupLabel(raw);
  if (!block) return { blockId: fallbackBlockId, groupLabel };
  const normalized = normalizeName(block);

  if (blockCache.has(normalized)) {
    return { blockId: blockCache.get(normalized)!, groupLabel };
  }

  // Unseen label: attach it to the closest block whose name it contains.
  for (const [key, id] of blockCache) {
    if (key.length > 3 && normalized.includes(key)) {
      blockCache.set(normalized, id);
      await prisma.blockAlias.upsert({
        where: { raw: normalized },
        create: { raw: normalized, blockId: id },
        update: {},
      });
      return { blockId: id, groupLabel };
    }
  }

  blockCache.set(normalized, fallbackBlockId);
  return { blockId: fallbackBlockId, groupLabel };
}

const exerciseCache = new Map<string, string>();

async function resolveExercise(
  rawName: string | null,
  blockId: string,
  loadCell: unknown,
): Promise<string | null> {
  if (!rawName) return null;
  const normalized = normalizeName(rawName);
  if (!normalized) return null;

  const cached = exerciseCache.get(normalized);
  if (cached) {
    await prisma.exercise.update({
      where: { id: cached },
      data: { usageCount: { increment: 1 } },
    });
    return cached;
  }

  const created = await prisma.exercise.upsert({
    where: { normalizedName: normalized },
    create: {
      name: rawName,
      normalizedName: normalized,
      primaryBlockId: blockId,
      isBodyweight: isBodyweightLoad(loadCell),
      isOpenChoice: isOpenChoiceExercise(rawName),
      usageCount: 1,
    },
    update: { usageCount: { increment: 1 } },
  });
  exerciseCache.set(normalized, created.id);
  return created.id;
}

// ---------------------------------------------------------------------------
// Workout sheets
// ---------------------------------------------------------------------------

/** Block ids belonging to the STRENGTH category, filled during loadBlocks. */
const strengthBlockIds = new Set<string>();

/**
 * A strength day is built around loaded slots — squat, hinge, press, pull,
 * carry. A movement day is mobility, core, and conditioning with little or no
 * external load. Counting loaded slots separates the two reliably.
 *
 * Runs only after blocks have been backfilled, since most sessions record no
 * block at all and would otherwise all look unloaded.
 */
async function classifyDayTypes(): Promise<void> {
  const sessions = await prisma.session.findMany({
    select: { id: true, items: { select: { blockId: true } } },
  });

  for (const session of sessions) {
    const loaded = session.items.filter((i) =>
      strengthBlockIds.has(i.blockId),
    ).length;
    await prisma.session.update({
      where: { id: session.id },
      data: { dayType: loaded >= 3 ? "STRENGTH" : "MOVEMENT" },
    });
  }
}

type PendingItem = {
  order: number;
  blockId: string;
  rawBlock: string | null;
  exerciseId: string | null;
  exerciseLabel: string | null;
  groupLabel: string | null;
  prescribedSets: string | null;
  prescribedReps: string | null;
  prescribedLoad: string | null;
  tempo: string | null;
  cues: string | null;
  target: string | null;
  performedRaw: string | null;
  notes: string | null;
  sets: {
    setNumber: number;
    load: number | null;
    loadRaw: string | null;
    reps: number | null;
  }[];
};

/**
 * Performed work is recorded in whichever column was convenient at the time.
 * Early sessions use the dedicated "weight performed" column; later ones write
 * per-set loads straight into the Load column and per-set reps into Reps.
 */
function buildPerformedSets(
  performedCell: unknown,
  loadCell: unknown,
  repsCell: unknown,
  setCount: number | null,
): {
  sets: PendingItem["sets"];
  performedRaw: string | null;
} {
  const loadsFromPerformed = performedCell
    ? parsePerformedSets(performedCell, setCount)
    : [];
  const hasPerformedNumbers = loadsFromPerformed.some((s) => s.load !== null);

  const loadIsLog = looksLikePerSetLog(loadCell, setCount);
  const loads = hasPerformedNumbers
    ? loadsFromPerformed
    : loadIsLog
      ? parsePerformedSets(loadCell, setCount)
      : [];

  const reps = parseRepList(repsCell);

  if (loads.length === 0 && !reps) {
    return { sets: [], performedRaw: null };
  }

  const length = Math.max(loads.length, reps?.length ?? 0);
  const sets = Array.from({ length }, (_, i) => ({
    setNumber: i + 1,
    load: loads[i]?.load ?? null,
    loadRaw: loads[i]?.loadRaw ?? null,
    reps: reps?.[i] ?? null,
  }));

  const performedRaw = hasPerformedNumbers
    ? cleanCell(performedCell)
    : loadIsLog
      ? cleanCell(loadCell)
      : cleanCell(repsCell);

  return { sets, performedRaw };
}

async function importWorkoutSheet(
  sheet: ExcelJS.Worksheet,
  clientId: string,
): Promise<number> {
  const rows = readSheet(sheet, 9);

  // The layout applies to every row under a header until the next one.
  let layout: "CUED" | "LOGGED" = "LOGGED";

  const buckets = new Map<
    string,
    { date: Date; layout: "CUED" | "LOGGED"; rows: Row[] }
  >();

  for (const row of rows) {
    if (!row) continue;
    if (isHeaderRow(row)) {
      layout = layoutFromHeader(row);
      continue;
    }
    const date = asDate(row[0]);
    if (!date) continue;
    if (!cleanCell(row[2])) continue;

    const key = dateKey(date);
    if (!buckets.has(key)) buckets.set(key, { date, layout, rows: [] });
    buckets.get(key)!.rows.push(row);
  }

  let created = 0;

  for (const bucket of buckets.values()) {
    const items: PendingItem[] = [];
    let bpPre: { systolic: number; diastolic: number } | null = null;
    let bpPost: { systolic: number; diastolic: number } | null = null;
    const sessionNotes: string[] = [];

    // Blocks are resolved up front so an untyped session can be classified from
    // its own content before its rows are interpreted.
    const resolvedBlocks = await Promise.all(
      bucket.rows.map((row) => resolveBlock(cleanCell(row[1]))),
    );
    const isCuedLayout = bucket.layout === "CUED";

    for (const [index, row] of bucket.rows.entries()) {
      const rawBlock = cleanCell(row[1]);
      const exerciseName = cleanCell(row[2]);
      const setsCell = cleanCell(row[3]);
      const repsCell = cleanCell(row[4]);
      const loadCell = row[5];
      const cueCell = cleanCell(row[6]);
      const performedOrTarget = row[7];
      const noteCell = cleanCell(row[8]);

      const { blockId, groupLabel } = resolvedBlocks[index];
      const exerciseId = await resolveExercise(exerciseName, blockId, loadCell);

      // Blood pressure is written into the notes column mid-log.
      if (noteCell) {
        const bp = parseBloodPressure(noteCell);
        if (bp) {
          if (isPostReading(noteCell)) bpPost = bp;
          else if (!bpPre) bpPre = bp;
          else bpPost = bp;
        }
      }

      const target = isCuedLayout ? cleanCell(performedOrTarget) : null;

      const setCount = parseSetCount(setsCell);
      const { sets: parsedSets, performedRaw } = buildPerformedSets(
        isCuedLayout ? null : performedOrTarget,
        loadCell,
        repsCell,
        setCount,
      );

      items.push({
        order: index,
        blockId,
        rawBlock,
        exerciseId,
        exerciseLabel: exerciseId ? null : exerciseName,
        groupLabel,
        prescribedSets: setsCell,
        prescribedReps: repsCell,
        prescribedLoad: cleanCell(loadCell),
        tempo: isCuedLayout ? null : cueCell,
        cues: isCuedLayout ? cueCell : null,
        target,
        performedRaw,
        notes: noteCell,
        sets: parsedSets,
      });

      if (noteCell && !parseBloodPressure(noteCell)) sessionNotes.push(noteCell);
    }

    // Rows carrying per-set data mean the session actually happened.
    const wasPerformed = items.some((item) => item.sets.length > 0);

    await prisma.session.create({
      data: {
        clientId,
        date: bucket.date,
        // Overwritten by classifyDayTypes once blocks are backfilled.
        status: wasPerformed ? "COMPLETED" : "PLANNED",
        bpPreSystolic: bpPre?.systolic,
        bpPreDiastolic: bpPre?.diastolic,
        bpPostSystolic: bpPost?.systolic,
        bpPostDiastolic: bpPost?.diastolic,
        items: {
          create: items.map((item) => ({
            order: item.order,
            blockId: item.blockId,
            rawBlock: item.rawBlock,
            exerciseId: item.exerciseId,
            exerciseLabel: item.exerciseLabel,
            groupLabel: item.groupLabel,
            prescribedSets: item.prescribedSets,
            prescribedReps: item.prescribedReps,
            prescribedLoad: item.prescribedLoad,
            tempo: item.tempo,
            cues: item.cues,
            target: item.target,
            performedRaw: item.performedRaw,
            notes: item.notes,
            sets: {
              create: item.sets.map((set) => ({
                setNumber: set.setNumber,
                load: set.load,
                loadRaw: set.loadRaw,
                reps: set.reps,
              })),
            },
          })),
        },
      },
    });
    created += 1;
  }

  return created;
}

// ---------------------------------------------------------------------------
// Re-evaluation sheets
// ---------------------------------------------------------------------------

const metricCache = new Map<
  string,
  { id: string; key: string; valueType: string }
>();

async function loadMetrics() {
  const metrics = await prisma.assessmentMetric.findMany();
  const byKey = new Map(metrics.map((m) => [m.key, m]));
  for (const definition of ASSESSMENT_METRICS) {
    const metric = byKey.get(definition.key);
    if (!metric) continue;
    for (const alias of [...definition.aliases, definition.name]) {
      metricCache.set(normalizeName(alias), {
        id: metric.id,
        key: metric.key,
        valueType: metric.valueType,
      });
    }
  }
}

/** Excel turns a typed "1:15" into a date; show it back as the coach wrote it. */
function formatRawValue(raw: unknown): string | null {
  if (raw instanceof Date) {
    const hours = raw.getUTCHours();
    const minutes = raw.getUTCMinutes();
    const seconds = raw.getUTCSeconds();
    if (seconds === 0) return `${hours}:${String(minutes).padStart(2, "0")}`;
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return cleanCell(raw);
}

function matchMetric(label: string) {
  const normalized = normalizeName(label);
  const exact = metricCache.get(normalized);
  if (exact) return exact;
  for (const [alias, metric] of metricCache) {
    if (alias.length > 4 && normalized.startsWith(alias)) return metric;
  }
  for (const [alias, metric] of metricCache) {
    if (alias.length > 4 && normalized.includes(alias)) return metric;
  }
  return null;
}

/**
 * Metrics whose text has no single meaningful number. The cardio test records
 * whichever of resting, peak, or recovery heart rate was noted that day, so a
 * naive first-number parse would chart three different things as one line.
 */
const UNCHARTABLE_TEXT_METRICS = new Set(["CARDIO_TEST"]);

function parseMetricValue(
  metricKey: string,
  valueType: string,
  raw: unknown,
): { numericValue: number | null; secondaryValue: number | null } {
  if (metricKey === "BLOOD_PRESSURE" || metricKey === "POST_TEST_BP") {
    const bp = parseBloodPressure(typeof raw === "string" ? raw : String(raw));
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
    default: {
      if (UNCHARTABLE_TEXT_METRICS.has(metricKey)) {
        return { numericValue: null, secondaryValue: null };
      }
      // The strength tests lead with the load worked ("380x15").
      return { numericValue: firstNumber(raw), secondaryValue: null };
    }
  }
}

async function importAssessmentSheet(
  sheet: ExcelJS.Worksheet,
  clientId: string,
): Promise<number> {
  const rows = readSheet(sheet, 12);
  const dateRow = rows.find(
    (row) => cleanCell(row?.[1])?.toLowerCase() === "date",
  );

  // Column C onward is one evaluation each.
  const columns: { index: number; date: Date | null; label: string }[] = [];
  for (let c = 2; c < 12; c += 1) {
    const date = dateRow ? asDate(dateRow[c]) : null;
    const headerLabel = cleanCell(rows[0]?.[c]);
    const hasValues = rows.some((row, i) => i > 1 && cleanCell(row?.[c]));
    if (!date && !hasValues) continue;
    columns.push({
      index: c,
      date,
      label: headerLabel === "Initial Eval" ? "Initial Eval" : `Eval ${columns.length + 1}`,
    });
  }

  let created = 0;

  for (const [position, column] of columns.entries()) {
    const values: {
      metricId: string;
      rawValue: string;
      numericValue: number | null;
      secondaryValue: number | null;
    }[] = [];

    for (const row of rows) {
      if (!row) continue;
      const label = cleanCell(row[1]);
      if (!label || label.toLowerCase() === "date") continue;

      const raw = row[column.index];
      const rawText = formatRawValue(raw);
      if (!rawText) continue;

      const metric = matchMetric(label);
      if (!metric) continue;
      if (values.some((v) => v.metricId === metric.id)) continue;

      const parsed = parseMetricValue(metric.key, metric.valueType, raw);
      values.push({
        metricId: metric.id,
        rawValue: rawText,
        numericValue: parsed.numericValue,
        secondaryValue: parsed.secondaryValue,
      });
    }

    if (values.length === 0) continue;

    await prisma.assessment.create({
      data: {
        clientId,
        date: column.date ?? new Date(),
        label: column.label,
        isInitial: position === 0,
        values: { create: values },
      },
    });
    created += 1;
  }

  return created;
}

// ---------------------------------------------------------------------------

/**
 * Later sessions stop filling the Block column — by then the sequence is
 * habitual and the coach just lists exercises. Those slots are recoverable:
 * the same exercise is labelled elsewhere, so its dominant block carries over.
 *
 * Only explicitly labelled items vote, so inference never feeds on itself.
 */
async function inferMissingBlocks(): Promise<number> {
  const labelled = await prisma.sessionItem.findMany({
    where: { rawBlock: { not: null }, exerciseId: { not: null } },
    select: { exerciseId: true, blockId: true },
  });

  const votes = new Map<string, Map<string, number>>();
  for (const item of labelled) {
    if (!item.exerciseId || item.blockId === fallbackBlockId) continue;
    if (!votes.has(item.exerciseId)) votes.set(item.exerciseId, new Map());
    const tally = votes.get(item.exerciseId)!;
    tally.set(item.blockId, (tally.get(item.blockId) ?? 0) + 1);
  }

  const dominant = new Map<string, string>();
  for (const [exerciseId, tally] of votes) {
    const [top] = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    dominant.set(exerciseId, top[0]);
  }

  // Record the dominant block on the exercise itself so the UI can suggest it.
  for (const [exerciseId, blockId] of dominant) {
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { primaryBlockId: blockId },
    });
  }

  let updated = 0;
  for (const [exerciseId, blockId] of dominant) {
    const result = await prisma.sessionItem.updateMany({
      where: { exerciseId, blockId: fallbackBlockId },
      data: { blockId },
    });
    updated += result.count;
  }

  // Exercises that are never labelled anywhere fall back to name matching.
  const blocks = await prisma.block.findMany({ select: { id: true, key: true } });
  const byKey = new Map(blocks.map((b) => [b.key, b.id]));

  const stillUnsorted = await prisma.exercise.findMany({
    where: { sessionItems: { some: { blockId: fallbackBlockId } } },
    select: { id: true, name: true },
  });

  for (const exercise of stillUnsorted) {
    const key = suggestBlockKey(exercise.name);
    const blockId = key ? byKey.get(key) : undefined;
    if (!blockId) continue;

    const result = await prisma.sessionItem.updateMany({
      where: { exerciseId: exercise.id, blockId: fallbackBlockId },
      data: { blockId },
    });
    updated += result.count;
    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { primaryBlockId: blockId },
    });
  }

  // Usage counts were incremented per lookup during import; recount from truth.
  const exercises = await prisma.exercise.findMany({
    select: { id: true, _count: { select: { sessionItems: true } } },
  });
  for (const exercise of exercises) {
    await prisma.exercise.update({
      where: { id: exercise.id },
      data: { usageCount: exercise._count.sessionItems },
    });
  }

  return updated;
}

async function resetImportedData() {
  await prisma.performedSet.deleteMany();
  await prisma.sessionItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.assessmentValue.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.client.deleteMany();
  console.log("Cleared existing client data");
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--"));
  if (!filePath) {
    console.error("Usage: npm run import:xlsx -- <path-to-xlsx> [--reset]");
    process.exit(1);
  }

  if (args.includes("--reset")) await resetImportedData();

  await loadBlocks();
  await loadMetrics();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheets = workbook.worksheets;
  const assessmentSheets = sheets.filter((s) => /\bRE\s*$/i.test(s.name));
  const workoutSheets = sheets.filter((s) => !/\bRE\s*$/i.test(s.name));

  // Every client in the workbook, whether or not they have a workout log yet.
  const clientNames = new Set<string>();
  for (const sheet of workoutSheets) clientNames.add(sheet.name.trim());
  for (const sheet of assessmentSheets) {
    const base = sheet.name.replace(/\s*RE\s*$/i, "").trim();
    if (![...clientNames].some((n) => namesMatch(n, base))) clientNames.add(base);
  }

  const clients = new Map<string, string>();
  for (const name of clientNames) {
    const { firstName, lastName } = splitName(name);
    const client = await prisma.client.create({
      data: { firstName, lastName, status: "ACTIVE" },
    });
    clients.set(name, client.id);
  }
  console.log(`Created ${clients.size} clients`);

  let sessionCount = 0;
  for (const sheet of workoutSheets) {
    const clientId = clients.get(sheet.name.trim());
    if (!clientId) continue;
    const count = await importWorkoutSheet(sheet, clientId);
    sessionCount += count;
    console.log(`  ${sheet.name}: ${count} sessions`);
  }

  let assessmentCount = 0;
  for (const sheet of assessmentSheets) {
    const base = sheet.name.replace(/\s*RE\s*$/i, "").trim();
    let clientId = clients.get(base);
    if (!clientId) {
      const match = [...clients.entries()].find(([name]) => namesMatch(name, base));
      clientId = match?.[1];
    }
    if (!clientId) {
      console.warn(`  ! no client matched for ${sheet.name}`);
      continue;
    }
    const count = await importAssessmentSheet(sheet, clientId);
    assessmentCount += count;
    console.log(`  ${sheet.name}: ${count} assessments`);
  }

  const inferred = await inferMissingBlocks();
  await classifyDayTypes();

  const exerciseCount = await prisma.exercise.count();
  console.log(
    `\nImported ${sessionCount} sessions, ${assessmentCount} assessments, ${exerciseCount} exercises`,
  );
  console.log(`Inferred a block for ${inferred} previously unlabelled items`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
