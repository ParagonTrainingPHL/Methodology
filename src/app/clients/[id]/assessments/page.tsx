import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ClientTabs } from "@/components/client-tabs";
import { clientName } from "@/lib/format";
import { AssessmentGrid } from "@/components/assessment-grid";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage({
  params,
}: PageProps<"/clients/[id]/assessments">) {
  const { id } = await params;

  const [client, metrics, assessments] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.assessmentMetric.findMany({ orderBy: { defaultOrder: "asc" } }),
    prisma.assessment.findMany({
      where: { clientId: id },
      orderBy: { date: "asc" },
      include: { values: { include: { metric: { select: { key: true } } } } },
    }),
  ]);

  if (!client) notFound();

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title={`${clientName(client)} — Evaluations`}
        subtitle="The standing re-evaluation battery, repeated over time"
      />

      <ClientTabs clientId={id} active="assessments" />

      <AssessmentGrid
        clientId={id}
        metrics={metrics.map((m) => ({
          key: m.key,
          name: m.name,
          category: m.category,
          unit: m.unit,
          valueType: m.valueType,
          description: m.description,
        }))}
        assessments={assessments.map((a) => ({
          id: a.id,
          date: a.date.toISOString().slice(0, 10),
          label: a.label,
          notes: a.notes,
          values: Object.fromEntries(
            a.values.map((v) => [v.metric.key, v.rawValue ?? ""]),
          ),
        }))}
      />
    </div>
  );
}
