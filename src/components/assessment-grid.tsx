"use client";

import { Fragment, useState, useTransition } from "react";
import { Card, CardHeader, EmptyState } from "./ui";
import { saveAssessment } from "@/app/actions/assessments";

type Metric = {
  key: string;
  name: string;
  category: string;
  unit: string | null;
  valueType: string;
  description: string | null;
};

type Assessment = {
  id: string;
  date: string;
  label: string | null;
  notes: string | null;
  values: Record<string, string>;
};

const CATEGORY_LABELS: Record<string, string> = {
  GIRTH: "Girths",
  BODY: "Body",
  VITAL: "Vitals",
  FITNESS: "Fitness testing",
};

const CATEGORY_ORDER = ["GIRTH", "BODY", "VITAL", "FITNESS"];

export function AssessmentGrid({
  clientId,
  metrics,
  assessments,
}: {
  clientId: string;
  metrics: Metric[];
  assessments: Assessment[];
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    metrics: metrics.filter((m) => m.category === category),
  })).filter((g) => g.metrics.length > 0);

  if (editing) {
    const current =
      editing === "new" ? null : assessments.find((a) => a.id === editing);
    return (
      <AssessmentForm
        clientId={clientId}
        groups={groups}
        assessment={current ?? null}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Evaluation history"
        subtitle={`${assessments.length} recorded`}
        actions={
          <button
            onClick={() => setEditing("new")}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-accent-soft transition-colors"
          >
            New evaluation
          </button>
        }
      />

      {assessments.length === 0 ? (
        <EmptyState
          title="No evaluations recorded"
          description="Run the battery to set a baseline, then repeat it to measure change."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="px-4 py-2.5 text-left font-medium text-ink-400 text-xs uppercase tracking-wide sticky left-0 bg-ink-900 min-w-56">
                  Measure
                </th>
                {assessments.map((a) => (
                  <th
                    key={a.id}
                    className="px-4 py-2.5 text-left font-medium text-ink-300 text-xs min-w-36"
                  >
                    <button
                      onClick={() => setEditing(a.id)}
                      className="hover:text-accent transition-colors text-left"
                    >
                      <div>{a.label ?? "Evaluation"}</div>
                      <div className="text-ink-500 font-normal tabular">
                        {a.date}
                      </div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.category}>
                  <tr className="bg-ink-850/50">
                    <td
                      colSpan={assessments.length + 1}
                      className="px-4 py-1.5 text-[11px] uppercase tracking-wide text-ink-400 font-medium"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.metrics.map((metric) => (
                    <tr
                      key={metric.key}
                      className="border-b border-ink-850 last:border-0"
                    >
                      <td
                        className="px-4 py-2 text-ink-200 sticky left-0 bg-ink-900"
                        title={metric.description ?? undefined}
                      >
                        {metric.name}
                        {metric.unit && (
                          <span className="text-ink-500 text-xs ml-1">
                            ({metric.unit})
                          </span>
                        )}
                      </td>
                      {assessments.map((a) => (
                        <td
                          key={a.id}
                          className="px-4 py-2 text-ink-300 tabular whitespace-nowrap"
                        >
                          {a.values[metric.key] || (
                            <span className="text-ink-600">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AssessmentForm({
  clientId,
  groups,
  assessment,
  onDone,
}: {
  clientId: string;
  groups: { category: string; label: string; metrics: Metric[] }[];
  assessment: Assessment | null;
  onDone: () => void;
}) {
  const [date, setDate] = useState(
    assessment?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [label, setLabel] = useState(assessment?.label ?? "");
  const [notes, setNotes] = useState(assessment?.notes ?? "");
  const [values, setValues] = useState<Record<string, string>>(
    assessment?.values ?? {},
  );
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveAssessment({
        clientId,
        assessmentId: assessment?.id ?? null,
        date,
        label: label.trim() || null,
        notes: notes.trim() || null,
        values,
      });
      onDone();
    });
  }

  return (
    <Card>
      <CardHeader
        title={assessment ? "Edit evaluation" : "New evaluation"}
        subtitle="Write values as you normally would — the shorthand is kept as typed"
        actions={
          <div className="flex gap-2">
            <button
              onClick={onDone}
              className="rounded border border-ink-600 px-3 py-1.5 text-sm text-ink-300 hover:text-ink-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-ink-950 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        }
      />

      <div className="p-4 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block col-span-2">
            <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
              Label
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Initial Eval"
              className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="text-[11px] uppercase tracking-wide text-ink-400 font-medium mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {group.metrics.map((metric) => (
                <label key={metric.key} className="block">
                  <span className="block text-xs text-ink-300 mb-1">
                    {metric.name}
                    {metric.unit && (
                      <span className="text-ink-500 ml-1">({metric.unit})</span>
                    )}
                  </span>
                  <input
                    value={values[metric.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [metric.key]: e.target.value }))
                    }
                    placeholder={placeholderFor(metric)}
                    className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 tabular focus:border-accent focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
    </Card>
  );
}

function placeholderFor(metric: Metric): string {
  if (metric.key === "BLOOD_PRESSURE" || metric.key === "POST_TEST_BP") {
    return "146/81";
  }
  switch (metric.valueType) {
    case "BILATERAL":
      return "115R 111L";
    case "DURATION":
      return "1:42";
    case "TEXT":
      return metric.key === "CARDIO_TEST" ? "max HR 157, recovery 3:06" : "380x15";
    default:
      return "";
  }
}
