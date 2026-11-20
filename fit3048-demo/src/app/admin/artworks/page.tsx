"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArtworkImage } from "@/components/ArtworkImage";
import { Loading, SourceNote } from "@/components/ui";
import { formatDate, money } from "@/lib/format";
import { useDemo } from "@/lib/store";

/** Admin\ArtworksController::index() + templates/Admin/Artworks/index.php */
export default function AdminArtworksPage() {
  const s = useDemo();
  const router = useRouter();
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");

  if (!s) return <Loading />;

  // Original: (new Collection($variants))->sortBy('price')->first() — sortBy is descending, so this is the highest price.
  const listPrice = (prices: number[]) => (prices.length ? Math.max(...prices) : null);

  const rows = s.artworks
    .filter((a) => !a.is_deleted)
    .filter((a) => status === "all" || a.availability_status === status)
    .filter((a) => !q.trim() || a.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => {
      const pa = listPrice(a.artwork_variants.map((v) => v.price)) ?? 0;
      const pb = listPrice(b.artwork_variants.map((v) => v.price)) ?? 0;
      if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sort === "price_high") return pb - pa;
      if (sort === "price_low") return pa - pb;
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-sm font-bold text-blue-700">Artworks</h1>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Dashboard
          </Link>{" "}
          / Artworks
        </nav>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div>
            <label htmlFor="status-filter" className="mb-1 block text-sm text-slate-700">
              Status
            </label>
            <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="mb-1 block text-sm text-slate-700">
              Sort By
            </label>
            <select id="sort-order" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_high">Price (High to Low)</option>
              <option value="price_low">Price (Low to High)</option>
            </select>
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="search-input" className="mb-1 block text-sm text-slate-700">
              Search
            </label>
            <input
              id="search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search artworks..."
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <Link href="/admin/artworks/add" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            + Add New Artwork
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-blue-700">All Artworks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {["Preview", "Title", "Price", "Status", "Created"].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => {
                const price = listPrice(a.artwork_variants.map((v) => v.price));
                const href = `/admin/artworks/edit/${a.artwork_id}`;
                return (
                  <tr
                    key={a.artwork_id}
                    tabIndex={0}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => router.push(href)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(href)}
                  >
                    <td className="px-4 py-2">
                      {/* The admin list previews the original file, webroot/img/Artworks/{id}.jpg */}
                      <ArtworkImage art={a} kind="original" className="h-[60px] w-[80px] rounded border border-slate-200 object-cover" />
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <Link href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 tabular-nums">{price !== null ? money(price) : "N/A"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold text-white ${a.availability_status === "available" ? "bg-emerald-600" : "bg-rose-600"}`}
                      >
                        {a.availability_status[0].toUpperCase() + a.availability_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(a.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <SourceNote files={["src/Controller/Admin/ArtworksController.php → index()", "templates/Admin/Artworks/index.php"]} />
    </div>
  );
}
