"use client";

import { useState, useTransition } from "react";
import { updateSessionVitals } from "@/app/actions/sessions";
import {
  categorizeBloodPressure,
  BP_CATEGORY_LABELS,
  BP_CATEGORY_STYLES,
} from "@/lib/format";

function toInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toFloat(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Accepts "147/88" in one field, which is how a reading is actually written. */
function splitBp(value: string): [number | null, number | null] {
  const match = value.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return [null, null];
  return [toInt(match[1]), toInt(match[2])];
}

export function SessionVitals(props: {
  sessionId: string;
  bpPreSystolic: number | null;
  bpPreDiastolic: number | null;
  bpPostSystolic: number | null;
  bpPostDiastolic: number | null;
  bodyweight: number | null;
  sessionRpe: number | null;
  notes: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const [pre, setPre] = useState(
    props.bpPreSystolic ? `${props.bpPreSystolic}/${props.bpPreDiastolic}` : "",
  );
  const [post, setPost] = useState(
    props.bpPostSystolic
      ? `${props.bpPostSystolic}/${props.bpPostDiastolic}`
      : "",
  );
  const [weight, setWeight] = useState(props.bodyweight?.toString() ?? "");
  const [rpe, setRpe] = useState(props.sessionRpe?.toString() ?? "");
  const [notes, setNotes] = useState(props.notes ?? "");

  function save() {
    const [preSys, preDia] = splitBp(pre);
    const [postSys, postDia] = splitBp(post);
    startTransition(async () => {
      await updateSessionVitals({
        sessionId: props.sessionId,
        bpPreSystolic: preSys,
        bpPreDiastolic: preDia,
        bpPostSystolic: postSys,
        bpPostDiastolic: postDia,
        bodyweight: toFloat(weight),
        sessionRpe: toFloat(rpe),
        notes: notes.trim() || null,
      });
      setEditing(false);
    });
  }

  const preCategory =
    props.bpPreSystolic && props.bpPreDiastolic
      ? categorizeBloodPressure(props.bpPreSystolic, props.bpPreDiastolic)
      : null;

  if (editing) {
    return (
      <div className="rounded-lg border border-ink-700 bg-ink-900 p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <Field label="BP before" value={pre} onChange={setPre} placeholder="147/88" />
          <Field label="BP after" value={post} onChange={setPost} placeholder="138/83" />
          <Field label="Bodyweight" value={weight} onChange={setWeight} placeholder="272" />
          <Field label="Session RPE" value={rpe} onChange={setRpe} placeholder="7" />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
            Session notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
            placeholder="Symptoms, substitutions, how the session felt"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={pending}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded border border-ink-600 px-3 py-1.5 text-sm text-ink-300 hover:text-ink-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const hasVitals =
    props.bpPreSystolic || props.bpPostSystolic || props.bodyweight || props.notes;

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full rounded-lg border border-ink-800 bg-ink-900 px-4 py-3 text-left hover:border-ink-700 transition-colors"
    >
      {hasVitals ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {props.bpPreSystolic && preCategory && (
              <span>
                <span className="text-ink-400 text-xs">BP before </span>
                <span className={`tabular font-medium ${BP_CATEGORY_STYLES[preCategory]}`}>
                  {props.bpPreSystolic}/{props.bpPreDiastolic}
                </span>
                <span className="text-ink-500 text-xs ml-1.5">
                  {BP_CATEGORY_LABELS[preCategory]}
                </span>
              </span>
            )}
            {props.bpPostSystolic && (
              <span>
                <span className="text-ink-400 text-xs">after </span>
                <span className="tabular text-ink-200">
                  {props.bpPostSystolic}/{props.bpPostDiastolic}
                </span>
              </span>
            )}
            {props.bodyweight && (
              <span>
                <span className="text-ink-400 text-xs">weight </span>
                <span className="tabular text-ink-200">{props.bodyweight}</span>
              </span>
            )}
            {props.sessionRpe && (
              <span>
                <span className="text-ink-400 text-xs">RPE </span>
                <span className="tabular text-ink-200">{props.sessionRpe}</span>
              </span>
            )}
          </div>
          {props.notes && (
            <p className="text-xs text-ink-300 whitespace-pre-wrap">
              {props.notes}
            </p>
          )}
        </div>
      ) : (
        <span className="text-xs text-ink-500">
          Add blood pressure, bodyweight, or session notes
        </span>
      )}
    </button>
  );
}

function Field({
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
    <div>
      <label className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 tabular focus:border-accent focus:outline-none"
      />
    </div>
  );
}
