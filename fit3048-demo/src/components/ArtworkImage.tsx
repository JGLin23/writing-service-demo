"use client";

import { useArtworkImage } from "@/lib/artworkImages";
import type { Artwork } from "@/lib/types";

/** Shows the stored image for an artwork ("wm" = public watermarked copy, "original" = admin preview). */
export function ArtworkImage({
  art,
  kind,
  className = "",
  alt,
}: {
  art: Artwork;
  kind: "wm" | "original";
  className?: string;
  alt?: string;
}) {
  const url = useArtworkImage(art, kind);
  if (url === undefined) {
    return <div className={`animate-pulse bg-slate-200 ${className}`} aria-label="Loading image" />;
  }
  if (url === null) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-xs text-slate-500 ${className}`}>
        No image uploaded
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- object URLs from IndexedDB, not optimisable by next/image
  return <img src={url} alt={alt ?? art.title} className={className} />;
}
