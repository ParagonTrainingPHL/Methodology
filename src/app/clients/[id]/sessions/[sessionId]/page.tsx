import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card, StatusPill } from "@/components/ui";
import { clientName, formatDate } from "@/lib/format";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";
import { SessionItemRow } from "@/components/session-item-row";
import { SessionVitals } from "@/components/session-vitals";
import { AddSlot } from "@/components/add-slot";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: PageProps<"/clients/[id]/sessions/[sessionId]">) {
  const { id, sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      client: true,
      items: {
        orderBy: { order: "asc" },
        include: {
          block: true,
          exercise: { select: { id: true, name: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session || session.clientId !== id) notFound();

  // Previous session's loads for the same exercise, so the coach can see what
  // to autoregulate against without leaving the page.
  const exerciseIds = session.items
    .map((i) => i.exerciseId)
    .filter((x): x is string => x !== null);

  const priorItems = await prisma.sessionItem.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      session: { clientId: id, date: { lt: session.date } },
      sets: { some: {} },
    },
    orderBy: { session: { date: "desc" } },
    include: {
      sets: { orderBy: { setNumber: "asc" } },
      session: { select: { date: true } },
    },
  });

  const lastTime = new Map<
    string,
    { date: Date; sets: { load: number | null; loadRaw: string | null; reps: number | null }[] }
  >();
  for (const item of priorItems) {
    if (!item.exerciseId || lastTime.has(item.exerciseId)) continue;
    lastTime.set(item.exerciseId, {
      date: item.session.date,
      sets: item.sets,
    });
  }

  const [blocks, exercises] = await Promise.all([
    prisma.block.findMany({ orderBy: { defaultOrder: "asc" } }),
    prisma.exercise.findMany({
      orderBy: { usageCount: "desc" },
      select: {
        id: true,
        name: true,
        primaryBlockId: true,
        usageCount: true,
      },
    }),
  ]);

  const groups = groupByCategory(session.items);

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title={formatDate(session.date)}
        subtitle={
          <span className="flex items-center gap-2">
            <Link
              href={`/clients/${id}`}
              className="text-accent hover:text-accent-soft"
            >
              {clientName(session.client)}
            </Link>
            <span className="text-ink-600">·</span>
            <span>{DAY_TYPE_LABELS[session.dayType as DayType]}</span>
            <StatusPill status={session.status} />
          </span>
        }
      />

      <SessionVitals
        sessionId={session.id}
        bpPreSystolic={session.bpPreSystolic}
        bpPreDiastolic={session.bpPreDiastolic}
        bpPostSystolic={session.bpPostSystolic}
        bpPostDiastolic={session.bpPostDiastolic}
        bodyweight={session.bodyweight}
        sessionRpe={session.sessionRpe}
        notes={session.notes}
      />

      <div className="space-y-5 mt-5">
        {groups.map((group) => (
          <Card key={group.category}>
            <div className="px-4 py-2.5 border-b border-ink-800 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide font-medium text-ink-300">
                {group.label}
              </h2>
              <span className="text-xs text-ink-500">
                {group.items.length} {group.items.length === 1 ? "slot" : "slots"}
              </span>
            </div>
            <ul className="divide-y divide-ink-850">
              {group.items.map((item) => (
                <SessionItemRow
                  key={item.id}
                  item={{
                    id: item.id,
                    blockName: item.block.name,
                    blockCategory: item.block.category,
                    exerciseName:
                      item.exercise?.name ?? item.exerciseLabel ?? null,
                    groupLabel: item.groupLabel,
                    prescribedSets: item.prescribedSets,
                    prescribedReps: item.prescribedReps,
                    prescribedLoad: item.prescribedLoad,
                    tempo: item.tempo,
                    cues: item.cues,
                    target: item.target,
                    notes: item.notes,
                    sets: item.sets.map((s) => ({
                      load: s.load,
                      loadRaw: s.loadRaw,
                      reps: s.reps,
                    })),
                  }}
                  lastTime={
                    item.exerciseId ? lastTime.get(item.exerciseId) ?? null : null
                  }
                />
              ))}
            </ul>
          </Card>
        ))}

        <AddSlot
          sessionId={session.id}
          blocks={blocks.map((b) => ({
            id: b.id,
            key: b.key,
            name: b.name,
            category: b.category,
          }))}
          exercises={exercises}
        />
      </div>
    </div>
  );
}

const CATEGORY_ORDER = [
  "PREP",
  "STRENGTH",
  "POWER",
  "CORE",
  "CONDITIONING",
  "RECOVERY",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  PREP: "Preparation",
  STRENGTH: "Strength",
  POWER: "Power",
  CORE: "Core",
  CONDITIONING: "Conditioning",
  RECOVERY: "Recovery",
  OTHER: "Unsorted",
};

function groupByCategory<T extends { block: { category: string } }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.block.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return [...groups.entries()]
    .sort(
      (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
    )
    .map(([category, items]) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      items,
    }));
}
