"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArtworkForm } from "@/components/ArtworkForm";
import { ArtworkImage } from "@/components/ArtworkImage";
import { Loading, NotFound, SourceNote } from "@/components/ui";
import { getWatermarkText } from "@/lib/actions";
import { fileSize, formatDateTime } from "@/lib/format";
import { padWatermarkText } from "@/lib/watermark";
import { useDemo } from "@/lib/store";

/** Admin\ArtworksController::edit() + templates/Admin/Artworks/edit.php */
export default function EditArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  if (!s) return <Loading />;
  const art = s.artworks.find((a) => a.artwork_id === id && !a.is_deleted);
  if (!art) return <NotFound what="Artwork" />;

  const info = art.watermark_info;
  const currentText = getWatermarkText(s);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-sm font-bold text-blue-700">Edit Artwork</h1>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link href="/admin/artworks" className="text-blue-700 hover:underline">
            Artworks
          </Link>{" "}
          / Edit
        </nav>
      </div>
      <Link href="/admin/artworks" className="inline-block text-sm text-blue-700 hover:underline">
        ← Back to Artworks
      </Link>

      <section className="rounded-lg border-2 border-dashed border-indigo-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 px-4 py-3">
          <h2 className="text-sm font-bold text-indigo-800">Watermark result (demo view)</h2>
          <span className="text-xs text-slate-500">The original admin page only shows the current image. This panel shows both stored files side by side.</span>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <figure>
            <ArtworkImage art={art} kind="original" className="aspect-[4/3] w-full rounded border border-slate-200 object-cover" alt={`${art.title}, original`} />
            <figcaption className="mt-2 text-xs text-slate-600">
              <strong>Original</strong>: <code>webroot/img/Artworks/{"{id}"}.jpg</code>, used for the admin list preview
            </figcaption>
          </figure>
          <figure>
            <ArtworkImage art={art} kind="wm" className="aspect-[4/3] w-full rounded border border-slate-200 object-cover" alt={`${art.title}, watermarked`} />
            <figcaption className="mt-2 text-xs text-slate-600">
              <strong>Watermarked</strong>: <code>{"{id}"}_wm.jpg</code> in Cloudflare R2, which the shop pages show
            </figcaption>
          </figure>
        </div>
        {info && (
          <dl className="grid gap-x-6 gap-y-1 border-t border-indigo-100 px-4 py-3 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="inline font-semibold">Watermark text: </dt>
              <dd className="inline">&ldquo;{info.text}&rdquo;, padded to {padWatermarkText(info.text).length} characters</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Image: </dt>
              <dd className="inline">
                {info.width} × {info.height}px
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Font size (binary search 10–400 pt): </dt>
              <dd className="inline">{info.fontSizePt} pt, fitting 88% of the diagonal</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Angles: </dt>
              <dd className="inline">±{info.angleDeg.toFixed(1)}° (both diagonals)</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Output: </dt>
              <dd className="inline">JPEG quality 75, {fileSize(info.bytes)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Created: </dt>
              <dd className="inline">{formatDateTime(info.created_at)}</dd>
            </div>
          </dl>
        )}
        {info && info.text !== currentText && (
          <p className="border-t border-indigo-100 px-4 py-3 text-xs text-amber-800">
            The Watermark Text is now &ldquo;{currentText}&rdquo;. As in the original, the text is applied at upload time, so upload the JPEG again
            below to re-watermark this artwork.
          </p>
        )}
      </section>

      <ArtworkForm key={art.artwork_id} artwork={art} />

      <SourceNote
        files={[
          "src/Controller/Admin/ArtworksController.php → edit(), _processImageUpload(), _saveOriginalLocal(), _createWatermarkedJpeg()",
          "templates/Admin/Artworks/edit.php",
        ]}
      />
    </div>
  );
}
