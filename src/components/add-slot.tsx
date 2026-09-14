"use client";

import { useMemo, useState, useTransition } from "react";
import { addSessionItem } from "@/app/actions/sessions";
import { suggestBlockKey } from "@/lib/classify";

type Block = { id: string; key: string; name: string; category: string };
type Exercise = {
  id: string;
  name: string;
  primaryBlockId: string | null;
  usageCount: number;
};

export function AddSlot({
  sessionId,
  blocks,
  exercises,
}: {
  sessionId: string;
  blocks: Block[];
  exercises: Exercise[];
}) {
  const [open, setOpen] = useState(false);
  const [blockId, setBlockId] = useState(blocks[0]?.id ?? "");
  // Once the coach picks a block by hand, name-based suggestions stop moving it.
  const [blockTouched, setBlockTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [load, setLoad] = useState("");
  const [tempo, setTempo] = useState("");
  const [pending, startTransition] = useTransition();

  const blocksByKey = useMemo(
    () => new Map(blocks.map((b) => [b.key, b])),
    [blocks],
  );

  // Exercises already programmed into this slot come first — the library is
  // large and the slot is the strongest signal for what belongs in it.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? exercises.filter((e) => e.name.toLowerCase().includes(q))
      : exercises.filter((e) => e.primaryBlockId === blockId);

    return [...pool]
      .sort((a, b) => {
        const aInBlock = a.primaryBlockId === blockId ? 1 : 0;
        const bInBlock = b.primaryBlockId === blockId ? 1 : 0;
        if (aInBlock !== bInBlock) return bInBlock - aInBlock;
        return b.usageCount - a.usageCount;
      })
      .slice(0, 8);
  }, [query, exercises, blockId]);

  function pickExercise(exercise: Exercise) {
    setExerciseId(exercise.id);
    setQuery(exercise.name);
    if (blockTouched) return;
    // Move the slot to where this exercise usually lives.
    const suggested = suggestBlockKey(exercise.name);
    const target =
      exercise.primaryBlockId ?? blocksByKey.get(suggested ?? "")?.id;
    if (target) setBlockId(target);
  }

  /**
   * A new exercise typed by hand still gets a slot suggested from its name, so
   * "Bulgarian split squat" lands in Lower rather than whatever was selected.
   */
  function handleQueryChange(value: string) {
    setQuery(value);
    setExerciseId(null);
    if (blockTouched) return;
    const suggested = suggestBlockKey(value);
    const target = suggested ? blocksByKey.get(suggested)?.id : undefined;
    if (target) setBlockId(target);
  }

  function submit() {
    startTransition(async () => {
      await addSessionItem({
        sessionId,
        blockId,
        exerciseId,
        exerciseLabel: exerciseId ? null : query.trim() || null,
        prescribedSets: sets.trim() || null,
        prescribedReps: reps.trim() || null,
        prescribedLoad: load.trim() || null,
        tempo: tempo.trim() || null,
        cues: null,
        groupLabel: null,
      });
      setQuery("");
      setExerciseId(null);
      setLoad("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-ink-700 px-4 py-3 text-sm text-ink-400 hover:border-ink-600 hover:text-ink-200 transition-colors"
      >
        Add slot
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
            Block
          </span>
          <select
            value={blockId}
            onChange={(e) => {
              setBlockId(e.target.value);
              setBlockTouched(true);
            }}
            className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
          >
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block relative">
          <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
            Exercise
          </span>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search, or type a new one"
            className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
          />
          {matches.length > 0 && !exerciseId && (
            <ul className="absolute z-10 mt-1 w-full rounded border border-ink-600 bg-ink-850 shadow-lg max-h-56 overflow-y-auto">
              {matches.map((exercise) => (
                <li key={exercise.id}>
                  <button
                    onClick={() => pickExercise(exercise)}
                    className="w-full px-2.5 py-1.5 text-left text-sm text-ink-200 hover:bg-ink-800"
                  >
                    {exercise.name}
                    <span className="text-ink-500 text-xs ml-2">
                      {exercise.usageCount}×
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <SmallField label="Sets" value={sets} onChange={setSets} placeholder="3" />
        <SmallField label="Reps / time" value={reps} onChange={setReps} placeholder="10–12" />
        <SmallField label="Load" value={load} onChange={setLoad} placeholder="35 lb DB" />
        <SmallField label="Tempo" value={tempo} onChange={setTempo} placeholder="3 count ECC" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={pending || (!exerciseId && !query.trim())}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add slot"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded border border-ink-600 px-3 py-1.5 text-sm text-ink-300 hover:text-ink-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SmallField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
