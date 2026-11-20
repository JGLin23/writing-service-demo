"use client";

import { useEffect, useState } from "react";
import { getWatermarkText, recordWatermark } from "./actions";
import { getImage, originalKey, putImage, watermarkedKey } from "./imageStore";
import { renderSampleArt } from "./sampleArt";
import { getState } from "./store";
import type { Artwork } from "./types";
import { assertJpeg, createWatermarkedJpeg, type WatermarkResult } from "./watermark";

async function watermarkAndStore(artworkId: string, original: Blob): Promise<WatermarkResult> {
  const text = getWatermarkText(getState());
  const result = await createWatermarkedJpeg(original, text);
  await putImage(watermarkedKey(artworkId), result.blob);
  recordWatermark(artworkId, {
    width: result.width,
    height: result.height,
    fontSizePt: result.fontSizePt,
    angleDeg: result.angleDeg,
    text,
    bytes: result.blob.size,
    created_at: new Date().toISOString(),
  });
  return result;
}

/**
 * Port of Admin\ArtworksController::_processImageUpload():
 * assert JPEG -> save original -> build watermarked JPEG -> "upload" {id}_wm.jpg.
 */
export async function processImageUpload(file: File, artworkId: string): Promise<WatermarkResult> {
  assertJpeg(file);
  await putImage(originalKey(artworkId), file);
  return watermarkAndStore(artworkId, file);
}

let samplesPromise: Promise<void> | null = null;

/** Generates and watermarks the sample artworks the first time the gallery or admin list opens. */
export function ensureSampleImages(): Promise<void> {
  if (!samplesPromise) {
    samplesPromise = (async () => {
      for (const art of getState().artworks) {
        if (!art.sample) continue;
        const existing = await getImage(watermarkedKey(art.artwork_id));
        if (existing) continue;
        const original = await renderSampleArt(art.sample);
        await putImage(originalKey(art.artwork_id), original);
        await watermarkAndStore(art.artwork_id, original);
      }
    })().finally(() => {
      samplesPromise = null;
    });
  }
  return samplesPromise;
}

/**
 * Object URL for an artwork image. kind "wm" is what Artwork::_getImageUrl() serves publicly;
 * kind "original" is the local file the admin list previews.
 * undefined = still loading, null = no image stored.
 */
export function useArtworkImage(art: Artwork | undefined, kind: "wm" | "original"): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const id = art?.artwork_id;
  const version = art?.image_version;
  const isSample = !!art?.sample;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      if (isSample) await ensureSampleImages();
      const blob = await getImage(kind === "wm" ? watermarkedKey(id) : originalKey(id));
      if (cancelled) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } else {
        setUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, version, kind, isSample]);

  return url;
}
