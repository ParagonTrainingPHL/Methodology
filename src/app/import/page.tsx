import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { ImportForm } from "@/components/import-form";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const [clients, sessions] = await Promise.all([
    prisma.client.count(),
    prisma.session.count(),
  ]);

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader
        title="Import tracker"
        subtitle="Upload a Training and Progress Tracker workbook"
      />

      <Card className="mb-5">
        <CardHeader title="Currently loaded" />
        <div className="px-4 py-3 text-sm text-ink-300">
          {clients === 0 ? (
            <span className="text-ink-400">
              No clients yet. Upload your tracker to get started.
            </span>
          ) : (
            <span className="tabular">
              {clients} clients · {sessions} sessions
            </span>
          )}
        </div>
      </Card>

      <ImportForm hasExistingData={clients > 0} />

      <Card className="mt-5">
        <CardHeader title="What gets imported" />
        <div className="px-4 py-3 text-sm text-ink-300 space-y-2">
          <p>
            Each client&rsquo;s workout sheet becomes their session history, and
            the matching &ldquo;RE&rdquo; sheet becomes their evaluations.
          </p>
          <p>
            Blocks missing from later sessions are recovered from how the same
            exercise is labelled elsewhere. Per-set loads written as
            &ldquo;77,88,88&rdquo; are split into separate sets, and everything
            you originally typed is kept alongside the parsed numbers.
          </p>
          <p className="text-ink-400">
            Your coach account is never touched by an import.
          </p>
        </div>
      </Card>
    </div>
  );
}
