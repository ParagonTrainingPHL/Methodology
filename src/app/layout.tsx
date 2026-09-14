import type { Metadata } from "next";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "Block-slot programming, autoregulated logging, and re-evaluation tracking.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Signed-out requests only ever reach the login page, which stands alone.
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {user ? (
          <div className="flex min-h-screen">
            <SidebarNav userName={user.name} />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
