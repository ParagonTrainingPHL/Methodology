import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { clientName } from "@/lib/format";
import { NewSessionForm } from "@/components/new-session-form";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({
  params,
}: PageProps<"/clients/[id]/sessions/new">) {
  const { id } = await params;

  const [client, templates, recent] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.sessionTemplate.findMany({
      where: { isArchived: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.session.findMany({
      where: { clientId: id },
      orderBy: { date: "desc" },
      take: 6,
      include: { _count: { select: { items: true } } },
    }),
  ]);

  if (!client) notFound();

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="New session"
        subtitle={clientName(client)}
      />
      <NewSessionForm
        clientId={id}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          dayType: t.dayType,
          slots: t._count.items,
        }))}
        recentSessions={recent.map((s) => ({
          id: s.id,
          date: s.date.toISOString().slice(0, 10),
          dayType: s.dayType,
          slots: s._count.items,
        }))}
      />
    </div>
  );
}
