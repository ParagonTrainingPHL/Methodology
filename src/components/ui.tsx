import type { ReactNode } from "react";
import { BLOCK_CATEGORY_COLORS, type BlockCategory } from "@/lib/constants";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink-100">
          {title}
        </h1>
        {subtitle && (
          <div className="text-sm text-ink-400 mt-1">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-ink-800 bg-ink-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ink-800">
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-ink-100">{title}</h2>
        {subtitle && <p className="text-xs text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function BlockBadge({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  const style =
    BLOCK_CATEGORY_COLORS[category as BlockCategory] ??
    BLOCK_CATEGORY_COLORS.OTHER;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${style}`}
    >
      {name}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-400">
        {label}
      </div>
      <div className="text-lg font-semibold text-ink-100 mt-1 tabular">
        {value}
      </div>
      {hint && <div className="text-xs text-ink-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-ink-200">{title}</p>
      {description && (
        <p className="text-xs text-ink-400 mt-1.5 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    PLANNED: "bg-ink-700/50 text-ink-300 border-ink-600",
    SKIPPED: "bg-red-500/10 text-red-400 border-red-500/25",
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    PAUSED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    ARCHIVED: "bg-ink-700/50 text-ink-400 border-ink-600",
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${
        styles[status] ?? styles.PLANNED
      }`}
    >
      {label}
    </span>
  );
}
