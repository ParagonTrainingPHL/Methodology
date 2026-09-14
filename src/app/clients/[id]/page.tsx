import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  PageHeader,
  Card,
  CardHeader,
  EmptyState,
  StatusPill,
  BlockBadge,
} from "@/components/ui";
import {
  clientName,
  formatDate,
  formatRelative,
  categorizeBloodPressure,
  BP_CATEGORY_STYLES,
  BP_CATEGORY_LABELS,
} from "@/lib/format";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";
import { getAssessmentSeries, summarizeChanges } from "@/lib/progress";
import { ClientTabs } from "@/components/client-tabs";

export const dynamic = "force-dynamic";

export default async function ClientPage({
  params,
}: PageProps<"/clients/[id]">) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { sessions: true, assessments: true } },
      sessions: {
        orderBy: { date: "desc" },
        include: {
          items: {
            include: { block: { select: { name: true, category: true } } },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!client) notFound();

  const series = await getAssessmentSeries(id);
  const changes = summarizeChanges(series);

  const lastBp = client.sessions.find(
    (s) => s.bpPreSystolic !== null && s.bpPreDiastolic !== null,
  );
  const bpCategory = lastBp
    ? categorizeBloodPressure(lastBp.bpPreSystolic!, lastBp.bpPreDiastolic!)
    : null;

  const completed = client.sessions.filter((s) => s.status === "COMPLETED");

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title={clientName(client)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusPill status={client.status} />
            <span>
              {client._count.sessions} sessions · {client._count.assessments}{" "}
              evaluations
            </span>
          </span>
        }
        actions={
          <Link
            href={`/clients/${id}/sessions/new`}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-accent-soft transition-colors"
          >
            New session
          </Link>
        }
      />

      <ClientTabs clientId={id} active="overview" />

      {client.medicalNotes && (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-amber-400 font-medium">
            Medical notes
          </div>
          <p className="text-sm text-ink-200 mt-1 whitespace-pre-wrap">
            {client.medicalNotes}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Session history"
              subtitle={`${completed.length} of ${client.sessions.length} logged with performed data`}
            />
            {client.sessions.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Build the first session from a template or start from an empty block sequence."
              />
            ) : (
              <ul className="divide-y divide-ink-850 max-h-[36rem] overflow-y-auto">
                {client.sessions.map((session) => {
                  const blocks = dedupeBlocks(session.items);
                  return (
                    <li key={session.id}>
                      <Link
                        href={`/clients/${id}/sessions/${session.id}`}
                        className="block px-4 py-3 hover:bg-ink-850/60 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-medium text-ink-100 tabular">
                              {formatDate(session.date)}
                            </span>
                            <span className="text-xs text-ink-400">
                              {DAY_TYPE_LABELS[session.dayType as DayType]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {session.bpPreSystolic && session.bpPreDiastolic && (
                              <span
                                className={`text-xs tabular ${
                                  BP_CATEGORY_STYLES[
                                    categorizeBloodPressure(
                                      session.bpPreSystolic,
                                      session.bpPreDiastolic,
                                    )
                                  ]
                                }`}
                              >
                                {session.bpPreSystolic}/{session.bpPreDiastolic}
                              </span>
                            )}
                            <span className="text-xs text-ink-500">
                              {session.items.length} slots
                            </span>
                            <StatusPill status={session.status} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {blocks.slice(0, 9).map((block) => (
                            <BlockBadge
                              key={block.name}
                              name={block.name}
                              category={block.category}
                            />
                          ))}
                          {blocks.length > 9 && (
                            <span className="text-[11px] text-ink-500 self-center">
                              +{blocks.length - 9}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          {bpCategory && lastBp && (
            <Card>
              <CardHeader title="Latest blood pressure" />
              <div className="px-4 py-3">
                <div
                  className={`text-2xl font-semibold tabular ${BP_CATEGORY_STYLES[bpCategory]}`}
                >
                  {lastBp.bpPreSystolic}/{lastBp.bpPreDiastolic}
                </div>
                <div className="text-xs text-ink-400 mt-1">
                  {BP_CATEGORY_LABELS[bpCategory]} ·{" "}
                  {formatRelative(lastBp.date)}
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Assessment change"
              subtitle="First evaluation to latest"
              actions={
                <Link
                  href={`/clients/${id}/progress`}
                  className="text-xs text-accent hover:text-accent-soft"
                >
                  Details
                </Link>
              }
            />
            {changes.length === 0 ? (
              <EmptyState
                title="Not enough evaluations"
                description="Two evaluations are needed before change can be shown."
              />
            ) : (
              <ul className="divide-y divide-ink-850">
                {changes.map((change) => (
                  <li
                    key={change.key}
                    className="flex items-center justify-between gap-3 px-4 py-2"
                  >
                    <span className="text-sm text-ink-200 truncate">
                      {change.name}
                    </span>
                    <span className="flex items-center gap-2 shrink-0 tabular">
                      <span className="text-xs text-ink-500">
                        {round(change.first)} → {round(change.latest)}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          change.improved === null
                            ? "text-ink-400"
                            : change.improved
                              ? "text-emerald-400"
                              : "text-red-400"
                        }`}
                      >
                        {change.delta > 0 ? "+" : ""}
                        {round(change.delta)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function dedupeBlocks(
  items: { block: { name: string; category: string } }[],
): { name: string; category: string }[] {
  const seen = new Map<string, { name: string; category: string }>();
  for (const item of items) {
    if (!seen.has(item.block.name)) seen.set(item.block.name, item.block);
  }
  return [...seen.values()];
}

function round(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
