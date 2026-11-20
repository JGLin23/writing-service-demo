"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearImages } from "@/lib/imageStore";
import { resetState } from "@/lib/store";
import { useNotices } from "./Notices";

/** Thin strip on every page that makes clear this is a demo with mock data. */
export function DemoBar() {
  const router = useRouter();
  const notices = useNotices();

  const reset = async () => {
    if (!window.confirm("Reset all demo data back to the starting sample data?")) return;
    await clearImages();
    resetState();
    notices.flash("info", "Demo data has been reset.");
    router.push("/");
  };

  return (
    <div className="bg-slate-900 text-slate-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-xs">
        <p>
          <Link href="/" className="font-semibold text-white hover:underline">
            FIT3048 demo
          </Link>
          <span className="hidden sm:inline"> · my parts only · mock data, no database, no logins</span>
        </p>
        <nav className="flex flex-wrap items-center gap-3" aria-label="Demo">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          <Link href="/writing-service-requests" className="hover:text-white">
            Client view
          </Link>
          <Link href="/admin" className="hover:text-white">
            Admin view
          </Link>
          <button type="button" onClick={reset} className="rounded border border-slate-600 px-2 py-0.5 hover:border-slate-400 hover:text-white">
            Reset demo data
          </button>
        </nav>
      </div>
    </div>
  );
}
