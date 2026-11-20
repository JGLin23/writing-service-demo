"use client";

import Link from "next/link";
import { useState } from "react";
import { useNotices } from "@/components/Notices";
import { Loading, SourceNote } from "@/components/ui";
import { restorePreviousValue, updateContentBlock } from "@/lib/actions";
import { formatDateTime } from "@/lib/format";
import { useDemo } from "@/lib/store";

/**
 * templates/Admin/ContentBlocks/index.php + edit.php, limited to the one block my
 * watermark code reads: slug "watermark-text" (seeded by config/Seeds/ContentBlocksSeed.php).
 */
export default function ContentBlocksPage() {
  const s = useDemo();
  const notices = useNotices();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  if (!s) return <Loading />;
  const block = s.contentBlocks.find((b) => b.slug === "watermark-text");
  if (!block) return <p>Content block missing.</p>;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      notices.flash("error", "The content block could not be saved. Please, try again.");
      return;
    }
    updateContentBlock(block.slug, value.trim());
    notices.flash("success", "The content block has been saved.");
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-sm font-bold text-blue-700">Content Blocks Management</h1>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Dashboard
          </Link>{" "}
          / Content Blocks
        </nav>
      </div>

      <p className="text-sm text-slate-600">
        The content-blocks module holds the editable site text. This demo shows only the block my watermark code reads.
      </p>

      <section className="max-w-xl rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-blue-700">{block.label}</h2>
          <span className="text-xs text-slate-500" title="Text">
            Text
          </span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-600">{block.description}</p>

          {editing ? (
            <form onSubmit={save} className="space-y-3">
              <label htmlFor="cb-value" className="block text-sm font-medium">
                Text Value
              </label>
              <input id="cb-value" value={value} onChange={(e) => setValue(e.target.value)} maxLength={60} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded bg-slate-500 px-4 py-2 text-sm text-white">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="rounded bg-slate-50 px-3 py-2 font-mono text-sm">{block.value}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue(block.value);
                    setEditing(true);
                  }}
                  className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Edit
                </button>
                {block.previous_value !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      restorePreviousValue(block.slug);
                      notices.flash("success", "The content block has been reverted to its previous value.");
                    }}
                    className="rounded border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    title="Retrieve previous value"
                  >
                    ↶ Retrieve previous value
                  </button>
                )}
              </div>
            </>
          )}
          <p className="text-xs text-slate-500">Last updated {formatDateTime(block.updated_at)}</p>
        </div>
      </section>

      <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        The watermark is drawn when a photo is uploaded, so a change here applies to photos uploaded afterwards. To try it,{" "}
        <Link href="/admin/artworks/add" className="font-semibold underline">
          upload a JPEG
        </Link>{" "}
        or re-upload one on an artwork&rsquo;s edit page.
      </div>

      <SourceNote
        files={[
          "config/Seeds/ContentBlocksSeed.php → slug 'watermark-text'",
          "src/Controller/Admin/ArtworksController.php → _drawCornerDiagonalText() reads it",
        ]}
      />
    </div>
  );
}
