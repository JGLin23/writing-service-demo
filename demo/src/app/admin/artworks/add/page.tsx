"use client";

import Link from "next/link";
import { ArtworkForm } from "@/components/ArtworkForm";
import { SourceNote } from "@/components/ui";

/** Admin\ArtworksController::add() + templates/Admin/Artworks/add.php */
export default function AddArtworkPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-sm font-bold text-blue-700">Add New Artwork</h1>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Dashboard
          </Link>{" "}
          /{" "}
          <Link href="/admin/artworks" className="text-blue-700 hover:underline">
            Artworks
          </Link>{" "}
          / Add
        </nav>
      </div>
      <Link href="/admin/artworks" className="inline-block text-sm text-blue-700 hover:underline">
        ← Back to Artworks
      </Link>
      <ArtworkForm />
      <SourceNote
        files={[
          "src/Controller/Admin/ArtworksController.php → add(), _processImageUpload(), _createWatermarkedJpeg(), _drawCornerDiagonalText()",
          "src/Service/R2StorageService.php → put()",
          "templates/Admin/Artworks/add.php",
        ]}
      />
    </div>
  );
}
