"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-ink-800 bg-ink-900 p-5 space-y-4"
    >
      {next && <input type="hidden" name="next" value={next} />}

      <label className="block">
        <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
          Email
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="w-full rounded border border-ink-600 bg-ink-850 px-2.5 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-ink-600 bg-ink-850 px-2.5 py-2 text-sm text-ink-100 focus:border-accent focus:outline-none"
        />
      </label>

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
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
