"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/store";

const links = [
  { href: "/artworks", label: "Gallery" },
  { href: "/writing-service-requests/add", label: "Writing Service" },
  { href: "/writing-service-requests", label: "My Requests" },
  { href: "/chat", label: "Chat (both sides)" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const s = useDemo();
  const client = s?.users.find((u) => u.user_id === s.clientId);

  const isActive = (href: string) =>
    href === "/writing-service-requests"
      ? pathname === href || pathname.startsWith("/writing-service-requests/view")
      : pathname.startsWith(href);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-slate-900 lowercase">
          studio demo
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 ${isActive(l.href) ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="w-full text-xs text-slate-500 sm:w-auto">
          Viewing as client: <span className="font-medium text-slate-700">{client ? `${client.first_name} ${client.last_name}` : "…"}</span>
        </p>
      </div>
    </header>
  );
}
