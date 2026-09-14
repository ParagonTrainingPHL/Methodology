import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader, EmptyState } from "@/components/ui";
import { BLOCK_CATEGORY_LABELS, type BlockCategory } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: PageProps<"/library">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const blocks = await prisma.block.findMany({
    orderBy: { defaultOrder: "asc" },
    include: {
      exercises: {
        where: query
          ? { name: { contains: query } }
          : undefined,
        orderBy: { usageCount: "desc" },
      },
    },
  });

  const populated = blocks.filter((b) => b.exercises.length > 0);
  const total = populated.reduce((sum, b) => sum + b.exercises.length, 0);

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Exercise Library"
        subtitle={`${total} exercises across ${populated.length} blocks`}
      />

      <form className="mb-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search exercises…"
          className="w-72 rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none"
        />
      </form>

      {populated.length === 0 ? (
        <Card>
          <EmptyState
            title="No exercises found"
            description={
              query
                ? `Nothing matches "${query}".`
                : "Exercises are added to the library as you programme them."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {populated.map((block) => (
            <Card key={block.id}>
              <CardHeader
                title={block.name}
                subtitle={`${BLOCK_CATEGORY_LABELS[block.category as BlockCategory]} · ${block.exercises.length}`}
              />
              <ul className="divide-y divide-ink-850 max-h-72 overflow-y-auto">
                {block.exercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-baseline justify-between gap-2 px-4 py-1.5"
                  >
                    <span className="text-sm text-ink-200 truncate">
                      {exercise.name}
                    </span>
                    <span className="text-[11px] text-ink-500 tabular shrink-0">
                      {exercise.usageCount}
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
