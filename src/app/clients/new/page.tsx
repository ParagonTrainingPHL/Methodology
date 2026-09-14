import { PageHeader, Card } from "@/components/ui";
import { createClient } from "@/app/actions/clients";

export default function NewClientPage() {
  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="New client" />

      <Card>
        <form action={createClient} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field name="firstName" label="First name" required />
            <Field name="lastName" label="Last name" />
            <Field name="email" label="Email" type="email" />
            <Field name="phone" label="Phone" />
          </div>

          <TextArea
            name="goals"
            label="Goals"
            placeholder="What this client is training for"
          />

          <TextArea
            name="medicalNotes"
            label="Medical notes"
            placeholder="Contraindications, medications, injury history — shown on every session"
          />

          <label className="block">
            <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
              Status
            </span>
            <select
              name="status"
              defaultValue="ACTIVE"
              className="rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-950 hover:bg-accent-soft"
          >
            Create client
          </button>
        </form>
      </Card>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wide text-ink-400 mb-1">
        {label}
      </span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded border border-ink-600 bg-ink-850 px-2 py-1.5 text-sm text-ink-100 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
