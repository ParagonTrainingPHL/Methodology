import { redirect } from "next/navigation";
import { needsSetup } from "@/app/actions/setup";
import { SetupForm } from "@/components/setup-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up · Methodology" };

export default async function SetupPage() {
  if (!(await needsSetup())) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink-100">
            Welcome to Methodology
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Create your coach account. This page closes once you&rsquo;re done.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
