import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader, EmptyState, BlockBadge } from "@/components/ui";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.sessionTemplate.findMany({
    where: { isArchived: false },
    orderBy: { name: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          block: { select: { name: true, category: true } },
          exercise: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Templates"
        subtitle="Reusable slot sequences. The sequence is the programme; exercises rotate within it."
      />

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            title="No templates yet"
            description="Save a session's slot sequence as a template to reuse it across clients. Until then, new sessions can be built by repeating a client's previous session."
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader
                title={template.name}
                subtitle={`${DAY_TYPE_LABELS[template.dayType as DayType]} · ${template.items.length} slots`}
              />
              <ul className="divide-y divide-ink-850">
                {template.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <div className="w-36 shrink-0">
                      <BlockBadge
                        name={item.block.name}
                        category={item.block.category}
                      />
                    </div>
                    <span className="text-sm text-ink-200 flex-1 truncate">
                      {item.exercise?.name ?? (
                        <span className="text-ink-500 italic">
                          coach&rsquo;s choice
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-ink-400 tabular shrink-0">
                      {[item.prescribedSets, item.prescribedReps]
                        .filter(Boolean)
                        .join(" × ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
