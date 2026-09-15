"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "./ui";
import { importUploadedWorkbook } from "@/app/actions/import";

export function ImportForm({ hasExistingData }: { hasExistingData: boolean }) {
  const [state, formAction, pending] = useActionState(
    importUploadedWorkbook,
    null,
  );
  const [fileName, setFileName] = useState<string | null>(null);

  if (state?.ok) {
    const { summary, replaced } = state;
    return (
      <Card>
        <CardHeader
          title="Import complete"
          subtitle={
            replaced > 0
              ? `Replaced ${replaced} existing clients`
              : undefined
          }
        />
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-4 gap-3 text-center">
            <Figure label="Clients" value={summary.clients} />
            <Figure label="Sessions" value={summary.sessions} />
            <Figure label="Evaluations" value={summary.assessments} />
            <Figure label="Exercises" value={summary.exercises} />
          </div>

          <p className="text-xs text-ink-400">
            Recovered a block for {summary.inferredBlocks} slots that had none
            recorded.
          </p>

          {summary.unmatchedSheets.length > 0 && (
            <p className="text-xs text-amber-400">
              Could not match these sheets to a client:{" "}
              {summary.unmatchedSheets.join(", ")}
            </p>
          )}

          <Link
            href="/"
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft"
          >
            View clients
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Upload" />
      <form action={formAction} className="px-4 py-4 space-y-4">
        <label className="block">
          <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1.5">
            Spreadsheet file (.xlsx)
          </span>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-sm file:text-ink-100 hover:file:bg-ink-600 file:cursor-pointer"
          />
          {fileName && (
            <span className="block text-xs text-ink-400 mt-1.5">{fileName}</span>
          )}
        </label>

        {hasExistingData && (
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              name="replace"
              defaultChecked
              className="mt-0.5 accent-amber-500"
            />
            <span className="text-sm text-ink-300">
              Replace existing clients
              <span className="block text-xs text-ink-500 mt-0.5">
                Leave this on when re-uploading an updated copy of the same
                workbook. Turning it off adds a second copy of every client.
              </span>
            </span>
          </label>
        )}

        {state && !state.ok && (
          <p className="text-xs text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import"}
        </button>

        {pending && (
          <p className="text-xs text-ink-400">
            Large workbooks take a minute. Leave this page open.
          </p>
        )}
      </form>
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-ink-800 px-2 py-2.5">
      <div className="text-lg font-semibold text-ink-100 tabular">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-ink-400 mt-0.5">
        {label}
      </div>
    </div>
  );
}
