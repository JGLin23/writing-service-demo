"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createArtwork, deleteArtwork, setArtworkStatus, updateArtwork } from "@/lib/actions";
import { processImageUpload } from "@/lib/artworkImages";
import type { Artwork } from "@/lib/types";
import { useNotices } from "./Notices";

const SIZES = ["A3", "A2", "A1"] as const;
const PRINT_TYPES = ["canvas", "print"] as const;

/** templates/Admin/Artworks/add.php and edit.php */
export function ArtworkForm({ artwork }: { artwork?: Artwork }) {
  const router = useRouter();
  const notices = useNotices();
  const isEdit = !!artwork;
  const [title, setTitle] = useState(artwork?.title ?? "");
  const [maxCopies, setMaxCopies] = useState(String(artwork?.max_copies ?? 5));
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [status, setStatus] = useState<Artwork["availability_status"]>(artwork?.availability_status ?? "available");
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const p: Record<string, string> = {};
    artwork?.artwork_variants.forEach((v) => (p[`${v.dimension}-${v.print_type}`] = String(v.price)));
    return p;
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const numericPrices = () => {
    const out: Record<string, number> = {};
    Object.entries(prices).forEach(([k, v]) => {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n) && n > 0) out[k] = n;
    });
    return out;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const copies = Number(maxCopies);
    if (!title.trim()) return setError("Please enter a title.");
    if (!Number.isInteger(copies) || copies < 1) return setError("Maximum copies must be a whole number of at least 1.");
    if (!isEdit && !file) return setError("Required: Please upload an image for this artwork");
    if (file && file.type !== "image/jpeg") {
      notices.flash("error", "Only JPEG uploads are allowed.");
      return;
    }

    setBusy(true);
    const input = { title: title.trim(), description, max_copies: copies, prices: numericPrices() };
    let id = artwork?.artwork_id;
    if (isEdit && id) {
      updateArtwork(id, input);
      setArtworkStatus(id, status);
      notices.flash("success", "Artwork has been updated successfully.");
    } else {
      id = createArtwork(input);
      notices.flash("success", "Artwork saved.");
    }

    if (file && id) {
      try {
        const res = await processImageUpload(file, id);
        notices.toast(
          "Watermark applied",
          `Original saved as ${id.slice(0, 8)}….jpg; watermarked copy "uploaded to R2" as …_wm.jpg (${res.width}×${res.height}, ${res.fontSizePt} pt).`,
        );
      } catch (err) {
        notices.flash("error", err instanceof Error ? err.message : "Image processing failed.");
      }
    }
    setBusy(false);
    router.push("/admin/artworks");
  };

  const onDelete = () => {
    if (!artwork || !window.confirm("Delete this artwork?")) return;
    deleteArtwork(artwork.artwork_id);
    notices.flash("success", "The artwork has been deleted.");
    router.push("/admin/artworks");
  };

  const pickFile = (f: File | undefined) => {
    if (f) setFile(f);
  };

  const card = "rounded-lg border border-slate-200 bg-white shadow-sm";
  const cardHead = "border-b border-slate-200 px-4 py-3 text-sm font-bold text-blue-700";
  const input = "w-full rounded border border-slate-300 px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3" noValidate>
      <div className="space-y-6 lg:col-span-2">
        <section className={card}>
          <h2 className={cardHead}>ⓘ Artwork Details</h2>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter artwork title" className={input} />
            </div>
            <div>
              <label htmlFor="max_copies" className="mb-1 block text-sm font-medium">
                Max Copies
              </label>
              <input
                id="max_copies"
                type="number"
                min={1}
                value={maxCopies}
                onChange={(e) => setMaxCopies(e.target.value)}
                placeholder="Enter maximum copies"
                className={input}
              />
            </div>
            {isEdit && (
              <div>
                <label htmlFor="availability_status" className="mb-1 block text-sm font-medium">
                  Availability Status
                </label>
                <select
                  id="availability_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Artwork["availability_status"])}
                  className={input}
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the artwork in detail..."
                className={input}
              />
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className={cardHead}>🏷 Variant Prices</h2>
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            {SIZES.map((size) => (
              <div key={size} className="rounded-md border border-slate-200 p-3">
                <h3 className="mb-3 text-center text-sm font-bold text-blue-700">{size}</h3>
                {PRINT_TYPES.map((pt) => {
                  const key = `${size}-${pt}`;
                  return (
                    <div key={key} className="mb-2">
                      <label htmlFor={key} className="mb-1 block text-xs text-slate-600">
                        <span className="sr-only">{size} </span>
                        {pt[0].toUpperCase() + pt.slice(1)} price ($)
                      </label>
                      <input
                        id={key}
                        inputMode="decimal"
                        value={prices[key] ?? ""}
                        onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="Enter price (0 to skip)"
                        className={input}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="px-4 pb-4 text-xs text-slate-500">Variants left empty or at $0 are not saved, like the original add() and edit().</p>
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <h2 className={cardHead}>🖼 Artwork Image</h2>
          <div className="p-4 text-center">
            <p className="mb-3 text-sm font-bold">{isEdit ? "Replace Artwork Image" : "Upload Artwork Image"}</p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`cursor-pointer rounded border-2 border-dashed p-6 text-sm ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300"}`}
            >
              {file ? (
                <p className="text-emerald-700">
                  <strong>Image ready for upload!</strong>
                  <br />
                  <span className="text-xs break-all">{file.name}</span>
                </p>
              ) : (
                <p className="text-slate-600">Drag and drop a JPEG here, or click to choose a file</p>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
              aria-label="Artwork image (JPEG)"
            />
            <small className="mt-2 block text-xs text-slate-500">
              {isEdit ? "Optional: a new JPEG is watermarked again with the current Watermark Text." : "Required: Please upload an image for this artwork"}
            </small>
            <small className="mt-1 block text-xs text-slate-500">Use your own photo or any test JPEG, not a client photo.</small>
          </div>
        </section>

        <section className={card}>
          <h2 className={cardHead}>⚙ Actions</h2>
          <div className="space-y-2 p-4">
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
              {busy ? "Watermarking…" : isEdit ? "Update Artwork" : "Save Artwork"}
            </button>
            {isEdit ? (
              <button type="button" onClick={onDelete} className="w-full rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Delete Artwork
              </button>
            ) : (
              <Link href="/admin/artworks" className="block w-full rounded bg-slate-500 px-4 py-2 text-center text-sm text-white hover:bg-slate-600">
                Cancel
              </Link>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}
