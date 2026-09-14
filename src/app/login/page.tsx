import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in · Methodology" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink-100">
            Methodology
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Sign in to continue.
          </p>
        </div>
        <LoginForm next={typeof next === "string" ? next : null} />
      </div>
    </div>
  );
}
