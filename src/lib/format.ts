export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatRelative(date: Date, now = new Date()): string {
  const days = Math.round(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

export function clientName(client: { firstName: string; lastName: string }) {
  return `${client.firstName} ${client.lastName}`.trim();
}

export function initials(client: { firstName: string; lastName: string }) {
  return `${client.firstName[0] ?? ""}${client.lastName[0] ?? ""}`.toUpperCase();
}

/** Renders a set list the way a coach reads it: "77 / 88 / 88". */
export function formatSetLoads(
  sets: { load: number | null; loadRaw: string | null; reps: number | null }[],
): string {
  if (sets.length === 0) return "";
  return sets
    .map((set) => {
      const load = set.load !== null ? String(set.load) : (set.loadRaw ?? "—");
      return set.reps !== null ? `${load}×${set.reps}` : load;
    })
    .join(" / ");
}

/**
 * Blood pressure categories follow the 2017 ACC/AHA thresholds. Used to flag
 * readings for review, never to diagnose.
 */
export type BpCategory = "normal" | "elevated" | "stage1" | "stage2" | "crisis";

export function categorizeBloodPressure(
  systolic: number,
  diastolic: number,
): BpCategory {
  if (systolic >= 180 || diastolic >= 120) return "crisis";
  if (systolic >= 140 || diastolic >= 90) return "stage2";
  if (systolic >= 130 || diastolic >= 80) return "stage1";
  if (systolic >= 120) return "elevated";
  return "normal";
}

export const BP_CATEGORY_STYLES: Record<BpCategory, string> = {
  normal: "text-emerald-400",
  elevated: "text-yellow-400",
  stage1: "text-orange-400",
  stage2: "text-red-400",
  crisis: "text-red-300 font-semibold",
};

export const BP_CATEGORY_LABELS: Record<BpCategory, string> = {
  normal: "Normal",
  elevated: "Elevated",
  stage1: "Stage 1",
  stage2: "Stage 2",
  crisis: "Crisis — refer out",
};
