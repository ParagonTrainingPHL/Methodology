"use client";

import { useActionState, useState } from "react";
import { completeSetup } from "@/app/actions/setup";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(completeSetup, null);

  // React resets an uncontrolled form once its action completes, which would
  // wipe every field whenever validation rejects the submission. Holding the
  // values here keeps them through a failed attempt.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <form
      action={formAction}
      className="rounded-lg border border-ink-800 bg-ink-900 p-5 space-y-4"
    >
      <Field
        name="name"
        label="Your name"
        autoComplete="name"
        autoFocus
        value={name}
        onChange={setName}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 10 characters."
        value={password}
        onChange={setPassword}
      />
      <Field
        name="confirm"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
      />

      {state?.error && (
        <p className="text-xs text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  autoFocus,
  hint,
  value,
  onChange,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-ink-600 bg-ink-850 px-2.5 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none"
      />
      {hint && <span className="block text-[11px] text-ink-500 mt-1">{hint}</span>}
    </label>
  );
}
