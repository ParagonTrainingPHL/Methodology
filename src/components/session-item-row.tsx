"use client";

import { useState, useTransition } from "react";
import { BlockBadge } from "./ui";
import { formatSetLoads, formatRelative } from "@/lib/format";
import { logSetsFromShorthand } from "@/app/actions/sessions";

type SetRecord = {
  load: number | null;
  loadRaw: string | null;
  reps: number | null;
};

export function SessionItemRow({
  item,
  lastTime,
}: {
  item: {
    id: string;
    blockName: string;
    blockCategory: string;
    exerciseName: string;
    groupLabel: string | null;
    prescribedSets: string | null;
    prescribedReps: string | null;
    prescribedLoad: string | null;
    tempo: string | null;
    cues: string | null;
    target: string | null;
    notes: string | null;
    sets: SetRecord[];
  };
  lastTime: { date: Date; sets: SetRecord[] } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    item.sets.map((s) => (s.load !== null ? s.load : (s.loadRaw ?? ""))).join(","),
  );
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await logSetsFromShorthand(item.id, value);
      setEditing(false);
    });
  }

  const prescription = [
    item.prescribedSets && item.prescribedReps
      ? `${item.prescribedSets} × ${item.prescribedReps}`
      : (item.prescribedSets ?? item.prescribedReps),
    item.prescribedLoad,
  ]
    .filter(Boolean)
    .join(" @ ");

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1.5 w-36 shrink-0 pt-0.5">
          <BlockBadge name={item.blockName} category={item.blockCategory} />
          {item.groupLabel && (
            <span className="text-[10px] font-semibold text-ink-400 tabular">
              {item.groupLabel}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink-100">
            {item.exerciseName}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink-400">
            {prescription && <span className="tabular">{prescription}</span>}
            {item.tempo && (
              <span className="text-ink-500">tempo: {item.tempo}</span>
            )}
            {item.target && (
              <span className="text-ink-500">target: {item.target}</span>
            )}
          </div>

          {item.cues && (
            <p className="text-xs text-ink-500 mt-1 italic">{item.cues}</p>
          )}

          {item.notes && (
            <p className="text-xs text-amber-400/80 mt-1">{item.notes}</p>
          )}
        </div>

        <div className="w-56 shrink-0 text-right">
          {editing ? (
            <div className="flex items-center gap-1.5 justify-end">
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") setEditing(false);
                }}
                placeholder="77,88,88"
                className="w-32 rounded border border-ink-600 bg-ink-850 px-2 py-1 text-sm text-ink-100 tabular focus:border-accent focus:outline-none"
              />
              <button
                onClick={save}
                disabled={pending}
                className="rounded bg-accent px-2 py-1 text-xs font-medium text-ink-950 disabled:opacity-50"
              >
                {pending ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="group inline-flex flex-col items-end"
            >
              {item.sets.length > 0 ? (
                <span className="text-sm font-medium text-emerald-400 tabular group-hover:text-emerald-300">
                  {formatSetLoads(item.sets)}
                </span>
              ) : (
                <span className="text-xs text-ink-500 group-hover:text-ink-300">
                  log sets
                </span>
              )}
              {lastTime && (
                <span className="text-[11px] text-ink-600 tabular mt-0.5">
                  last {formatRelative(lastTime.date)}:{" "}
                  {formatSetLoads(lastTime.sets)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
