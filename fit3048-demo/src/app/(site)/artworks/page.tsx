"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArtworkImage } from "@/components/ArtworkImage";
import { Loading, SourceNote } from "@/components/ui";
import { plainNumber } from "@/lib/format";
import { useDemo } from "@/lib/store";

export default function GalleryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Gallery />
    </Suspense>
  );
}

/** ArtworksController::index() + templates/Artworks/index.php */
function Gallery() {
  const s = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("status");
  const status = raw === "available" || raw === "sold" ? raw : null;
  const pageTitle = status === "available" ? "Art For Sale" : status === "sold" ? "Art Sold" : "Art Gallery";

  if (!s) return <Loading />;

  const artworks = s.artworks.filter((a) => !a.is_deleted && (!status || a.availability_status === status));

  const filters: { label: string; value: string | null; href: string }[] = [
    { label: "All Artwork", value: null, href: "/artworks" },
    { label: "Art For Sale", value: "available", href: "/artworks?status=available" },
    { label: "Art Sold", value: "sold", href: "/artworks?status=sold" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`rounded-full px-4 py-2 text-sm transition select-none ${
              status === f.value ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {artworks.length === 0 ? (
        <p className="text-center text-slate-500">No artworks to show.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((a) => {
            const cheapest = a.artwork_variants.length ? Math.min(...a.artwork_variants.map((v) => v.price)) : 0;
            const href = `/artworks/view/${a.artwork_id}`;
            return (
              <div
                key={a.artwork_id}
                role="link"
                tabIndex={0}
                aria-label={`${a.title}${a.availability_status === "sold" ? " (sold)" : ""}`}
                onClick={() => router.push(href)}
                onKeyDown={(e) => e.key === "Enter" && router.push(href)}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md bg-slate-200"
              >
                <ArtworkImage art={a} kind="wm" className="h-full w-full object-cover" />
                {a.availability_status === "available" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/70 group-hover:opacity-100 group-focus:bg-black/70 group-focus:opacity-100">
                    <h2 className="mb-2 text-xl font-bold">{a.title}</h2>
                    <p className="mb-4">From ${plainNumber(cheapest)}</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-2xl font-bold text-white">
                    <div>Sold</div>
                    <div className="mt-2 text-xl">${plainNumber(cheapest)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Every image here is the watermarked copy (<code>{"{id}_wm.jpg"}</code>), as served by <code>Artwork::_getImageUrl()</code>. The sample artworks are generated in
        the browser.
      </p>

      <SourceNote files={["src/Controller/ArtworksController.php → index()", "src/Model/Entity/Artwork.php → _getImageUrl()", "templates/Artworks/index.php"]} />
    </div>
  );
}
