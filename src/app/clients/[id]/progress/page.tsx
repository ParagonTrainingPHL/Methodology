import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { ClientTabs } from "@/components/client-tabs";
import { clientName, formatShortDate, formatDuration } from "@/lib/format";
import {
  getAssessmentSeries,
  summarizeChanges,
  getBlockExposure,
  getBloodPressureHistory,
  getExerciseTrends,
} from "@/lib/progress";
import {
  MetricChart,
  BloodPressureChart,
  BlockExposureChart,
  LoadTrendChart,
} from "@/components/charts";

export const dynamic = "force-dynamic";

/** Metrics worth a chart of their own, in the order a coach reviews them. */
const FEATURED = [
  "WEIGHT",
  "WAIST",
  "GRIP",
  "PLANK",
  "SIT_AND_REACH",
  "BACK_EXTENSION",
  "PUSH_UPS",
  "LEG_PRESS",
  "LAT_PULLDOWN",
  "SINGLE_LEG_STAND",
];

export default async function ProgressPage({
  params,
}: PageProps<"/clients/[id]/progress">) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [series, exposure, bpHistory, trends] = await Promise.all([
    getAssessmentSeries(id),
    getBlockExposure(id),
    getBloodPressureHistory(id),
    getExerciseTrends(id, 3),
  ]);

  const changes = summarizeChanges(series);
  const byKey = new Map(series.map((s) => [s.key, s]));
  const featured = FEATURED.map((key) => byKey.get(key)).filter(
    (s): s is NonNullable<typeof s> =>
      s !== undefined && s.points.filter((p) => p.value !== null).length >= 2,
  );

  // Pre-session readings only: they are taken under the same conditions every
  // time, so they are the ones comparable across sessions. Mixing in post
  // readings would chart two different measurements as one line.
  const bpData = bpHistory
    .filter((r) => r.preSystolic !== null && r.preDiastolic !== null)
    .map((r) => ({
      date: formatShortDate(r.date),
      systolic: r.preSystolic,
      diastolic: r.preDiastolic,
    }));

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title={`${clientName(client)} — Progress`}
        subtitle="Evaluation battery, clinical markers, and training exposure"
      />

      <ClientTabs clientId={id} active="progress" />

      {changes.length > 0 && (
        <Card className="mb-5">
          <CardHeader
            title="Since the first evaluation"
            subtitle="Function and health markers are the outcome measure here, not load on the bar"
          />
          <div className="grid grid-cols-4 divide-x divide-ink-850">
            {changes
              .filter((c) => c.improved !== null)
              .slice(0, 8)
              .map((change) => (
                <div key={change.key} className="px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-ink-400 truncate">
                    {change.name}
                  </div>
                  <div
                    className={`text-lg font-semibold tabular mt-1 ${
                      change.improved ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {change.delta > 0 ? "+" : ""}
                    {formatNumber(change.delta)}
                    {change.unit ? (
                      <span className="text-xs font-normal text-ink-400 ml-1">
                        {change.unit}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-ink-500 tabular mt-0.5">
                    {formatNumber(change.first)} → {formatNumber(change.latest)}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {bpData.length >= 2 && (
        <Card className="mb-5">
          <CardHeader
            title="Blood pressure"
            subtitle={`${bpData.length} pre-session readings, banded by ACC/AHA stage`}
          />
          <div className="px-2 py-3">
            <BloodPressureChart data={bpData} />
          </div>
        </Card>
      )}

      {featured.length > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-5">
          {featured.map((metric) => (
            <Card key={metric.key}>
              <CardHeader
                title={metric.name}
                subtitle={
                  metric.valueType === "BILATERAL"
                    ? "Solid: right · Dashed: left"
                    : (metric.unit ?? undefined)
                }
              />
              <div className="px-2 py-3">
                <MetricChart
                  unit={metric.unit}
                  data={metric.points.map((p) => ({
                    date: formatShortDate(p.date),
                    value:
                      metric.key === "PLANK" && p.value !== null
                        ? p.value
                        : p.value,
                    secondary: p.secondary,
                  }))}
                />
              </div>
              {metric.key === "PLANK" && (
                <div className="px-4 pb-3 text-xs text-ink-500 tabular">
                  {metric.points
                    .filter((p) => p.value !== null)
                    .map((p) => formatDuration(p.value!))
                    .join(" → ")}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="Training exposure"
            subtitle="Where the programmed time actually goes"
          />
          {exposure.length === 0 ? (
            <EmptyState title="No sessions logged" />
          ) : (
            <div className="px-2 py-3">
              <BlockExposureChart data={exposure.slice(0, 16)} />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Load progression"
            subtitle="Heaviest set per session, for exercises with enough history"
          />
          {trends.length === 0 ? (
            <EmptyState
              title="Not enough logged load"
              description="Log per-set loads across a few sessions to see progression."
            />
          ) : (
            <ul className="divide-y divide-ink-850 max-h-[32rem] overflow-y-auto">
              {trends.slice(0, 8).map((trend) => {
                const delta = trend.latestTopLoad - trend.firstTopLoad;
                return (
                  <li key={trend.exerciseId} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-ink-100 truncate">
                        {trend.name}
                      </span>
                      <span
                        className={`text-xs font-medium tabular shrink-0 ${
                          delta > 0
                            ? "text-emerald-400"
                            : delta < 0
                              ? "text-red-400"
                              : "text-ink-400"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {formatNumber(delta)}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-500 mb-1">
                      {trend.blockName} · {trend.sessions} sessions
                    </div>
                    <LoadTrendChart
                      data={trend.points.map((p) => ({
                        date: formatShortDate(p.date),
                        topLoad: p.topLoad,
                      }))}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
