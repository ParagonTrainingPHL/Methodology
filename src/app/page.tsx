import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Card, EmptyState, StatusPill } from "@/components/ui";
import {
  clientName,
  initials,
  formatRelative,
  formatDate,
  categorizeBloodPressure,
  BP_CATEGORY_STYLES,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: [{ status: "asc" }, { firstName: "asc" }],
    include: {
      _count: { select: { sessions: true, assessments: true } },
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          date: true,
          dayType: true,
          bpPreSystolic: true,
          bpPreDiastolic: true,
        },
      },
      assessments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, label: true },
      },
    },
  });

  const totalSessions = clients.reduce((sum, c) => sum + c._count.sessions, 0);

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients · ${totalSessions} sessions logged`}
        actions={
          <Link
            href="/clients/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-accent-soft transition-colors"
          >
            New client
          </Link>
        }
      />

      <Card>
        {clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            description="Add a client to start programming, or import an existing tracker workbook."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800 text-left">
                <th className="px-4 py-2.5 font-medium text-ink-400 text-xs uppercase tracking-wide">
                  Client
                </th>
                <th className="px-4 py-2.5 font-medium text-ink-400 text-xs uppercase tracking-wide">
                  Last session
                </th>
                <th className="px-4 py-2.5 font-medium text-ink-400 text-xs uppercase tracking-wide">
                  Sessions
                </th>
                <th className="px-4 py-2.5 font-medium text-ink-400 text-xs uppercase tracking-wide">
                  Last eval
                </th>
                <th className="px-4 py-2.5 font-medium text-ink-400 text-xs uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const lastSession = client.sessions[0];
                const lastAssessment = client.assessments[0];
                const bp =
                  lastSession?.bpPreSystolic && lastSession?.bpPreDiastolic
                    ? categorizeBloodPressure(
                        lastSession.bpPreSystolic,
                        lastSession.bpPreDiastolic,
                      )
                    : null;

                return (
                  <tr
                    key={client.id}
                    className="border-b border-ink-850 last:border-0 hover:bg-ink-850/60 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/clients/${client.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-700 text-[11px] font-semibold text-ink-200">
                          {initials(client)}
                        </span>
                        <span className="font-medium text-ink-100 group-hover:text-accent transition-colors">
                          {clientName(client)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink-300">
                      {lastSession ? (
                        <span className="flex items-center gap-2">
                          <span>{formatRelative(lastSession.date)}</span>
                          {bp && (
                            <span
                              className={`text-xs tabular ${BP_CATEGORY_STYLES[bp]}`}
                              title="Pre-session blood pressure"
                            >
                              {lastSession.bpPreSystolic}/
                              {lastSession.bpPreDiastolic}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-300 tabular">
                      {client._count.sessions}
                    </td>
                    <td className="px-4 py-2.5 text-ink-300">
                      {lastAssessment ? (
                        formatDate(lastAssessment.date)
                      ) : (
                        <span className="text-ink-500">none</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={client.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
