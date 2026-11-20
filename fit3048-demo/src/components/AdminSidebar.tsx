"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: "▦", exact: true },
  { href: "/admin/writing-service-requests", label: "Writing Services", icon: "✎" },
  { href: "/admin/artworks", label: "Artworks", icon: "▣" },
  { href: "/admin/content-blocks", label: "Content Blocks", icon: "¶" },
];

/**
 * Sidebar from element/admin/sidebar.php, limited to the menu items for my features.
 * On narrow screens it collapses into a horizontal bar.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="bg-slate-800 text-slate-200 md:w-60 md:shrink-0">
      <div className="hidden px-5 py-5 md:block">
        <p className="text-sm font-bold tracking-wide text-white lowercase">studio demo</p>
        <p className="text-xs text-slate-400">Admin dashboard</p>
      </div>
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:px-3 md:py-0">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap ${
              active(it.href, it.exact) ? "bg-slate-900 text-white" : "hover:bg-slate-700"
            }`}
          >
            <span aria-hidden className="w-4 text-center">
              {it.icon}
            </span>
            {it.label}
          </Link>
        ))}
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap text-slate-400 hover:bg-slate-700 md:mt-6">
          <span aria-hidden className="w-4 text-center">
            ←
          </span>
          Back to site
        </Link>
      </nav>
    </aside>
  );
}
