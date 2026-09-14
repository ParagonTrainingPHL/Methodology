"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "./ui";
import { createSession, copySession } from "@/app/actions/sessions";
import { DAY_TYPE_LABELS, type DayType } from "@/lib/constants";

type Template = { id: string; name: string; dayType: string; slots: number };
type RecentSession = {
  id: string;
  date: string;
  dayType: string;
  slots: number;
};

type Source =
  | { kind: "blank" }
  | { kind: "template"; id: string }
  | { kind: "copy"; id: string; keepExercises: boolean };

export function NewSessionForm({
  clientId,
  templates,
  recentSessions,
}: {
  clientId: string;
  templates: Template[];
  recentSessions: RecentSession[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayType, setDayType] = useState<DayType>("STRENGTH");
  const [source, setSource] = useState<Source>({ kind: "blank" });
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      let sessionId: string;
      if (source.kind === "copy") {
        sessionId = await copySession({
          sourceSessionId: source.id,
          clientId,
          date,
          keepExercises: source.keepExercises,
        });
      } else {
        sessionId = await createSession({
          clientId,
          date,
          dayType,
          templateId: source.kind === "template" ? source.id : null,
        });
      }
      router.push(`/clients/${clientId}/sessions/${sessionId}`);
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="When" />
        <div className="p-4 grid grid-cols-2 gap-4">
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
          <div>
            <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
              Day type
            </span>
            <div className="flex gap-1.5">
              {(["STRENGTH", "MOVEMENT"] as DayType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDayType(type)}
                  disabled={source.kind === "copy"}
                  className={`flex-1 rounded border px-2 py-1.5 text-xs transition-colors disabled:opacity-40 ${
                    dayType === type
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-ink-600 text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {DAY_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Starting point"
          subtitle="The block sequence is what repeats; exercises rotate within it"
        />
        <div className="p-4 space-y-2">
          <Option
            selected={source.kind === "blank"}
            onSelect={() => setSource({ kind: "blank" })}
            title="Empty session"
            description="Build the slot sequence from scratch"
          />

          {recentSessions.map((session) => (
            <Option
              key={session.id}
              selected={source.kind === "copy" && source.id === session.id}
              onSelect={() =>
                setSource({
                  kind: "copy",
                  id: session.id,
                  keepExercises: true,
                })
              }
              title={`Repeat ${session.date}`}
              description={`${DAY_TYPE_LABELS[session.dayType as DayType]} · ${session.slots} slots`}
            >
              {source.kind === "copy" && source.id === session.id && (
                <div className="flex gap-1.5 mt-2">
                  <ToggleChip
                    active={source.keepExercises}
                    onClick={() =>
                      setSource({ ...source, keepExercises: true })
                    }
                    label="Keep exercises"
                  />
                  <ToggleChip
                    active={!source.keepExercises}
                    onClick={() =>
                      setSource({ ...source, keepExercises: false })
                    }
                    label="Slots only"
                  />
                </div>
              )}
            </Option>
          ))}

          {templates.map((template) => (
            <Option
              key={template.id}
              selected={source.kind === "template" && source.id === template.id}
              onSelect={() => setSource({ kind: "template", id: template.id })}
              title={template.name}
              description={`Template · ${template.slots} slots`}
            />
          ))}
        </div>
      </Card>

      <button
        onClick={submit}
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create session"}
      </button>
    </div>
  );
}

function Option({
  selected,
  onSelect,
  title,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded border px-3 py-2.5 cursor-pointer transition-colors ${
        selected
          ? "border-accent bg-accent/5"
          : "border-ink-700 hover:border-ink-600"
      }`}
    >
      <div className="text-sm text-ink-100">{title}</div>
      <div className="text-xs text-ink-400 mt-0.5">{description}</div>
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded px-2 py-1 text-[11px] border transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-ink-600 text-ink-400 hover:text-ink-200"
      }`}
    >
      {label}
    </button>
  );
}
