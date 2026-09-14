/**
 * Parsers for the free-text shorthand used in coaching notation.
 *
 * Everything here is deliberately forgiving: the source material is written by
 * a coach mid-session, not by a form. Raw text is always preserved alongside
 * whatever number we manage to extract.
 */

export type ParsedSet = {
  setNumber: number;
  load: number | null;
  loadRaw: string;
};

const NUMBER_RE = /-?\d+(?:\.\d+)?/;

/** First number appearing anywhere in the text. */
export function firstNumber(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input !== "string") return null;
  const match = input.match(NUMBER_RE);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : null;
}

/** All numbers appearing in the text, in order. */
export function allNumbers(input: string): number[] {
  const matches = input.match(/-?\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches
    .map((m) => Number.parseFloat(m))
    .filter((n) => Number.isFinite(n));
}

/**
 * Excel coerced comma-separated load lists like "110,125,125" into the integer
 * 110125125. When the digit count divides evenly by the set count and every
 * chunk lands in a plausible load range, the original list is recoverable.
 */
function splitIntoChunks(digits: string, count: number): number[] | null {
  if (digits.length % count !== 0) return null;
  const width = digits.length / count;
  if (width < 2 || width > 3) return null;

  const chunks: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const chunk = digits.slice(i * width, (i + 1) * width);
    // A leading zero means the split landed in the wrong place.
    if (chunk.startsWith("0")) return null;
    chunks.push(Number.parseInt(chunk, 10));
  }
  // Loads should be in a believable range.
  if (chunks.some((c) => c < 5 || c > 999)) return null;
  return chunks;
}

/**
 * Excel coerced comma-separated load lists like "110,125,125" into the integer
 * 110125125. When the digit count divides evenly and every chunk lands in a
 * plausible load range, the original list is recoverable. The coach does not
 * always record a value for every set, so try the full set count first and then
 * narrower splits.
 */
function recoverCommaStrippedLoads(
  digits: string,
  setCount: number,
): number[] | null {
  if (digits.length < 4) return null;
  const upper = Math.max(setCount, 2);
  for (let count = upper; count >= 2; count -= 1) {
    const chunks = splitIntoChunks(digits, count);
    if (chunks) return chunks;
  }
  return null;
}

/**
 * Parse a performed-load entry into per-set values.
 *
 * Handles "77,88,88", "35, 40, 50", "30,30", a bare "110", the Excel-mangled
 * 110125125, and descriptive text like ":30 hold/medial/lateral" (kept raw).
 */
export function parsePerformedSets(
  value: unknown,
  expectedSets?: number | null,
): ParsedSet[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "number") {
    const digits = String(Math.trunc(Math.abs(value)));
    if (expectedSets && expectedSets > 1) {
      const recovered = recoverCommaStrippedLoads(digits, expectedSets);
      if (recovered) {
        return recovered.map((load, i) => ({
          setNumber: i + 1,
          load,
          loadRaw: String(load),
        }));
      }
    }
    return [{ setNumber: 1, load: value, loadRaw: String(value) }];
  }

  const text = String(value).trim();
  if (!text) return [];

  // "3×10" / "1×2 min" are prescriptions restated, not performed loads.
  if (/^\d+\s*[×x]\s*/i.test(text)) {
    return [{ setNumber: 1, load: null, loadRaw: text }];
  }

  const parts = text
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts.map((part, i) => ({
      setNumber: i + 1,
      load: firstNumber(part),
      loadRaw: part,
    }));
  }

  return [{ setNumber: 1, load: firstNumber(text), loadRaw: text }];
}

/**
 * Whether a cell records what was actually done set by set, rather than a single
 * prescription. A comma-separated list ("35,40,50") or an Excel-mangled run of
 * digits both mean per-set values were logged.
 */
export function looksLikePerSetLog(
  value: unknown,
  expectedSets?: number | null,
): boolean {
  if (value === null || value === undefined) return false;

  if (typeof value === "number") {
    if (!expectedSets || expectedSets < 2) return false;
    const digits = String(Math.trunc(Math.abs(value)));
    return recoverCommaStrippedLoads(digits, expectedSets) !== null;
  }

  const text = String(value).trim();
  if (!text) return false;
  if (!text.includes(",")) return false;
  // "45–60 sec/side" style ranges are prescriptions, not logs.
  return allNumbers(text).length >= 2;
}

/**
 * Reps are autoregulated too: "12,12,12" or "15,15,12" record what each set
 * actually produced. Returns null when the cell is a plain prescription.
 */
export function parseRepList(value: unknown): number[] | null {
  if (typeof value !== "string") return null;
  if (!value.includes(",")) return null;

  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  const reps: number[] = [];
  for (const part of parts) {
    // Anything with units is a duration or distance, not a rep count.
    if (/[a-z:]/i.test(part)) return null;
    const value = Number.parseInt(part, 10);
    if (!Number.isFinite(value) || value < 1 || value > 200) return null;
    reps.push(value);
  }
  return reps;
}

export type BloodPressure = { systolic: number; diastolic: number };

/** Pull a "147/88" style reading out of surrounding prose. */
export function parseBloodPressure(input: unknown): BloodPressure | null {
  if (typeof input !== "string") return null;
  const match = input.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return null;
  const systolic = Number.parseInt(match[1], 10);
  const diastolic = Number.parseInt(match[2], 10);
  if (systolic < 60 || systolic > 260) return null;
  if (diastolic < 30 || diastolic > 180) return null;
  if (diastolic >= systolic) return null;
  return { systolic, diastolic };
}

/** True when the reading was taken after the session rather than before. */
export function isPostReading(input: string): boolean {
  return /\b(end|post|after|finish)\b/i.test(input);
}

/**
 * Durations appear as ":39", "1:15", "60 sec", "2 min", or an Excel time value.
 * Returns seconds.
 */
export function parseDuration(input: unknown): number | null {
  if (input === null || input === undefined) return null;

  if (input instanceof Date) {
    const hours = input.getUTCHours();
    const minutes = input.getUTCMinutes();
    const seconds = input.getUTCSeconds();
    // Excel stores a typed "1:15" as 1h15m. In this context the coach means
    // 1 minute 15 seconds — a 75-second plank, not a 75-minute one.
    if (seconds === 0 && hours < 12) return hours * 60 + minutes;
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (typeof input === "number") return input;

  const text = String(input).trim();
  if (!text) return null;

  const clock = text.match(/(\d+)?\s*:\s*(\d{1,2})/);
  if (clock) {
    const minutes = clock[1] ? Number.parseInt(clock[1], 10) : 0;
    const seconds = Number.parseInt(clock[2], 10);
    return minutes * 60 + seconds;
  }

  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minuteMatch) return Number.parseFloat(minuteMatch[1]) * 60;

  const secondMatch = text.match(/(\d+(?:\.\d+)?)\s*sec/i);
  if (secondMatch) return Number.parseFloat(secondMatch[1]);

  return firstNumber(text);
}

export type BilateralValue = { right: number | null; left: number | null };

/**
 * Bilateral tests are written many ways: "R: 111.9, 122 L: 117, 109.3",
 * "115R 111L 117R 112L", "52R 53L", "29L,60".
 * Takes the best (highest) attempt per side, which is how the test is scored.
 */
/** Reads a run of values, converting "1 min" to 60 when scoring in seconds. */
function valuesInSegment(segment: string, asSeconds: boolean): number[] {
  if (!asSeconds) return allNumbers(segment);

  const values: number[] = [];
  for (const m of segment.matchAll(/(\d+(?:\.\d+)?)\s*(min|m\b|sec|s\b)?/gi)) {
    if (!m[1]) continue;
    const value = Number.parseFloat(m[1]);
    if (!Number.isFinite(value)) continue;
    values.push(/^m/i.test(m[2] ?? "") ? value * 60 : value);
  }
  return values;
}

export function parseBilateral(
  input: unknown,
  options: { asSeconds?: boolean } = {},
): BilateralValue {
  if (typeof input === "number") return { right: input, left: null };
  if (typeof input !== "string") return { right: null, left: null };

  const text = input.trim();
  if (!text) return { right: null, left: null };

  const asSeconds = options.asSeconds ?? false;
  const rights: number[] = [];
  const lefts: number[] = [];

  // "115R" / "111L" — side marker trailing the number. A following colon means
  // the letter labels the *next* run ("122 L: 117"), so it is not a suffix.
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*([RL])\b(?!\s*:)/gi)) {
    const value = Number.parseFloat(m[1]);
    if (m[2].toUpperCase() === "R") rights.push(value);
    else lefts.push(value);
  }

  // "R: 111.9, 122" — side marker leading a run of numbers.
  for (const m of text.matchAll(/\b([RL])\s*:\s*([^RL]*)/gi)) {
    const values = valuesInSegment(m[2], asSeconds);
    if (m[1].toUpperCase() === "R") rights.push(...values);
    else lefts.push(...values);
  }

  if (rights.length === 0 && lefts.length === 0) {
    const values = valuesInSegment(text, asSeconds);
    return { right: values.length ? Math.max(...values) : null, left: null };
  }

  return {
    right: rights.length ? Math.max(...rights) : null,
    left: lefts.length ? Math.max(...lefts) : null,
  };
}

/**
 * Girths and similar are often recorded as repeat measurements: "43.2, 41.5cm".
 * The mean is the fair representation of a repeated measure.
 */
export function parseRepeatedMeasure(input: unknown): number | null {
  if (typeof input === "number") return input;
  if (typeof input !== "string") return null;
  const values = allNumbers(input);
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  const sum = values.reduce((a, b) => a + b, 0);
  return Number.parseFloat((sum / values.length).toFixed(2));
}

/** "295lbs x 13" -> estimated 1RM via Epley, for the strength test rows. */
export function parseRepMaxTest(
  input: unknown,
): { load: number; reps: number; estimated1rm: number } | null {
  if (typeof input !== "string") return null;
  const match = input.match(/(\d+(?:\.\d+)?)\s*(?:lbs?)?\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  const load = Number.parseFloat(match[1]);
  const reps = Number.parseInt(match[2], 10);
  if (!Number.isFinite(load) || !Number.isFinite(reps) || reps < 1) return null;
  return {
    load,
    reps,
    estimated1rm: Number.parseFloat((load * (1 + reps / 30)).toFixed(1)),
  };
}

/** Epley. Unreliable past ~12 reps, which is why tests are capped low. */
export function estimate1RM(load: number, reps: number): number {
  return Number.parseFloat((load * (1 + reps / 30)).toFixed(1));
}

export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9'"/+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Set counts are usually "3" but occasionally "3-4" or a number. */
export function parseSetCount(input: unknown): number | null {
  if (typeof input === "number") return Math.trunc(input);
  if (typeof input !== "string") return null;
  const value = firstNumber(input);
  return value === null ? null : Math.trunc(value);
}

const OPEN_CHOICE_RE = /\b(choice|machine of choice|optional)\b/i;

export function isOpenChoiceExercise(name: string): boolean {
  return OPEN_CHOICE_RE.test(name);
}

const BODYWEIGHT_RE = /^\s*(bodyweight|body weight|bw)\s*$/i;

export function isBodyweightLoad(input: unknown): boolean {
  return typeof input === "string" && BODYWEIGHT_RE.test(input);
}

export function cleanCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim().replace(/\s+/g, " ");
  return text.length ? text : null;
}
