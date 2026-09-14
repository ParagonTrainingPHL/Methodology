import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview", path: "" },
  { key: "progress", label: "Progress", path: "/progress" },
  { key: "assessments", label: "Evaluations", path: "/assessments" },
];

export function ClientTabs({
  clientId,
  active,
}: {
  clientId: string;
  active: string;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-ink-800 mb-5">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/clients/${clientId}${tab.path}`}
          className={`px-3 py-2 text-sm border-b-2 -mb-px transition-colors ${
            active === tab.key
              ? "border-accent text-ink-100 font-medium"
              : "border-transparent text-ink-400 hover:text-ink-200"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
