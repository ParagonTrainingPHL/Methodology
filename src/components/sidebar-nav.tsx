"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Clients" },
  { href: "/library", label: "Exercise Library" },
  { href: "/templates", label: "Templates" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-ink-800 bg-ink-900 flex flex-col">
      <div className="px-5 py-5 border-b border-ink-800">
        <Link href="/" className="block">
          <div className="text-sm font-semibold tracking-tight text-ink-100">
            Methodology
          </div>
          <div className="text-[11px] text-ink-400 mt-0.5">Training system</div>
        </Link>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5">
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/" || pathname.startsWith("/clients")
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-ink-800 text-ink-100 font-medium"
                  : "text-ink-300 hover:bg-ink-850 hover:text-ink-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
