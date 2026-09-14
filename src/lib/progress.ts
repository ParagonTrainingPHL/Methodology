import { prisma } from "./db";

export type MetricSeries = {
  key: string;
  name: string;
  category: string;
  unit: string | null;
  valueType: string;
  higherIsBetter: boolean | null;
  points: {
    date: Date;
    label: string | null;
    value: number | null;
    secondary: number | null;
    raw: string | null;
  }[];
};

/**
 * The assessment battery as a set of time series — the primary outcome measure
 * in this methodology, since progress here is function and health markers
 * rather than load on the bar.
 */
export async function getAssessmentSeries(
  clientId: string,
): Promise<MetricSeries[]> {
  const assessments = await prisma.assessment.findMany({
    where: { clientId },
    orderBy: { date: "asc" },
    include: {
      values: { include: { metric: true } },
    },
  });

  const series = new Map<string, MetricSeries>();

  for (const assessment of assessments) {
    for (const value of assessment.values) {
      const metric = value.metric;
      if (!series.has(metric.key)) {
        series.set(metric.key, {
          key: metric.key,
          name: metric.name,
          category: metric.category,
          unit: metric.unit,
          valueType: metric.valueType,
          higherIsBetter: metric.higherIsBetter,
          points: [],
        });
      }
      series.get(metric.key)!.points.push({
        date: assessment.date,
        label: assessment.label,
        value: value.numericValue,
        secondary: value.secondaryValue,
        raw: value.rawValue,
      });
    }
  }

  return [...series.values()];
}

export type MetricChange = {
  key: string;
  name: string;
  unit: string | null;
  first: number;
  latest: number;
  delta: number;
  percent: number;
  /** Null when the metric has no inherent good direction. */
  improved: boolean | null;
};

/** Change from the first recorded value to the most recent. */
export function summarizeChanges(series: MetricSeries[]): MetricChange[] {
  const changes: MetricChange[] = [];

  for (const metric of series) {
    const points = metric.points.filter((p) => p.value !== null);
    if (points.length < 2) continue;

    const first = points[0].value!;
    const latest = points[points.length - 1].value!;
    if (first === 0) continue;

    const delta = latest - first;
    changes.push({
      key: metric.key,
      name: metric.name,
      unit: metric.unit,
      first,
      latest,
      delta,
      percent: (delta / first) * 100,
      improved:
        metric.higherIsBetter === null || metric.higherIsBetter === undefined
          ? null
          : delta === 0
            ? null
            : delta > 0 === metric.higherIsBetter,
    });
  }

  return changes;
}

export type ExerciseTrend = {
  exerciseId: string;
  name: string;
  blockName: string;
  sessions: number;
  points: { date: Date; topLoad: number; totalReps: number }[];
  firstTopLoad: number;
  latestTopLoad: number;
};

/**
 * Load progression per exercise, using the heaviest set in each session.
 * Only exercises with enough logged history to show a trend are returned.
 */
export async function getExerciseTrends(
  clientId: string,
  minSessions = 3,
): Promise<ExerciseTrend[]> {
  const items = await prisma.sessionItem.findMany({
    where: {
      session: { clientId },
      exerciseId: { not: null },
      sets: { some: { load: { not: null } } },
    },
    include: {
      sets: true,
      exercise: { select: { id: true, name: true } },
      block: { select: { name: true } },
      session: { select: { date: true } },
    },
    orderBy: { session: { date: "asc" } },
  });

  const grouped = new Map<string, ExerciseTrend>();

  for (const item of items) {
    if (!item.exercise) continue;
    const loads = item.sets
      .map((s) => s.load)
      .filter((l): l is number => l !== null);
    if (loads.length === 0) continue;

    const topLoad = Math.max(...loads);
    const totalReps = item.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);

    if (!grouped.has(item.exercise.id)) {
      grouped.set(item.exercise.id, {
        exerciseId: item.exercise.id,
        name: item.exercise.name,
        blockName: item.block.name,
        sessions: 0,
        points: [],
        firstTopLoad: topLoad,
        latestTopLoad: topLoad,
      });
    }

    const trend = grouped.get(item.exercise.id)!;
    trend.points.push({ date: item.session.date, topLoad, totalReps });
    trend.sessions += 1;
    trend.latestTopLoad = topLoad;
  }

  return [...grouped.values()]
    .filter((t) => t.sessions >= minSessions)
    .sort((a, b) => b.sessions - a.sessions);
}

export type BlockExposure = {
  name: string;
  category: string;
  count: number;
};

/** How the client's training time is actually distributed across slots. */
export async function getBlockExposure(
  clientId: string,
): Promise<BlockExposure[]> {
  const items = await prisma.sessionItem.findMany({
    where: { session: { clientId } },
    select: { block: { select: { name: true, category: true } } },
  });

  const tally = new Map<string, BlockExposure>();
  for (const item of items) {
    const key = item.block.name;
    if (!tally.has(key)) {
      tally.set(key, { name: key, category: item.block.category, count: 0 });
    }
    tally.get(key)!.count += 1;
  }

  return [...tally.values()].sort((a, b) => b.count - a.count);
}

export type BpReading = {
  date: Date;
  preSystolic: number | null;
  preDiastolic: number | null;
  postSystolic: number | null;
  postDiastolic: number | null;
};

export async function getBloodPressureHistory(
  clientId: string,
): Promise<BpReading[]> {
  const sessions = await prisma.session.findMany({
    where: {
      clientId,
      OR: [
        { bpPreSystolic: { not: null } },
        { bpPostSystolic: { not: null } },
      ],
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      bpPreSystolic: true,
      bpPreDiastolic: true,
      bpPostSystolic: true,
      bpPostDiastolic: true,
    },
  });

  return sessions.map((s) => ({
    date: s.date,
    preSystolic: s.bpPreSystolic,
    preDiastolic: s.bpPreDiastolic,
    postSystolic: s.bpPostSystolic,
    postDiastolic: s.bpPostDiastolic,
  }));
}
