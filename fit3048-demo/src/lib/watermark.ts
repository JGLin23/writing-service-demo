"use client";

/**
 * Browser port of the watermark code in the original project:
 *   src/Controller/Admin/ArtworksController.php
 *     _assertJpeg()            -> assertJpeg()
 *     _createWatermarkedJpeg() -> createWatermarkedJpeg()
 *     _drawCornerDiagonalText()
 * PHP GD (imagettfbbox / imagettftext) is replaced by the Canvas 2D API.
 */

export const WATERMARK_FONT_FAMILY = "WatermarkMPlusRounded";
const WATERMARK_FONT_URL = "/fonts/MPLUSRounded1c-Medium.ttf";

/** GD measures TrueType text in points at 96 dpi; canvas uses CSS pixels. */
const PT_TO_PX = 96 / 72;

let fontPromise: Promise<void> | null = null;

/** Loads webroot/font/MPLUSRounded1c-Medium.ttf, the same font the PHP code uses. */
export function loadWatermarkFont(): Promise<void> {
  if (!fontPromise) {
    fontPromise = (async () => {
      const face = new FontFace(WATERMARK_FONT_FAMILY, `url(${WATERMARK_FONT_URL})`);
      await face.load();
      document.fonts.add(face);
    })().catch((e) => {
      fontPromise = null;
      throw new Error(`Missing font at ${WATERMARK_FONT_URL} (${String(e)})`);
    });
  }
  return fontPromise;
}

export function assertJpeg(file: File): void {
  if (file.type !== "image/jpeg") {
    throw new Error("Only JPEG uploads are allowed.");
  }
}

export interface WatermarkResult {
  blob: Blob;
  width: number;
  height: number;
  /** Font size picked by the binary search, in GD points. */
  fontSizePt: number;
  angleDeg: number;
  displayText: string;
}

/** Pad the string exactly like the PHP code: 10 spaces each side, every space becomes 15. */
export function padWatermarkText(rawText: string): string {
  return " ".repeat(10) + rawText.split(" ").join(" ".repeat(15)) + " ".repeat(10);
}

/**
 * Applies the diagonal text watermark and returns a JPEG at quality 75
 * (imagejpeg($im, null, 75)).
 */
export async function createWatermarkedJpeg(source: Blob, rawText: string): Promise<WatermarkResult> {
  await loadWatermarkFont();

  const bitmap = await createImageBitmap(source).catch(() => {
    throw new Error("Invalid JPEG data.");
  });
  const width = bitmap.width;
  const height = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to allocate watermark colour.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { fontSizePt, angleDeg, displayText } = drawCornerDiagonalText(ctx, width, height, rawText);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to capture JPEG output."))), "image/jpeg", 0.75),
  );

  return { blob, width, height, fontSizePt, angleDeg, displayText };
}

function drawCornerDiagonalText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rawText: string,
): { fontSizePt: number; angleDeg: number; displayText: string } {
  const displayText = padWatermarkText(rawText);

  // imagecolorallocatealpha($canvas, 200, 200, 200, 90): GD alpha 0 = opaque, 127 = transparent.
  ctx.fillStyle = `rgba(200, 200, 200, ${(1 - 90 / 127).toFixed(3)})`;

  // Diagonal geometry
  const diagLen = Math.hypot(width, height);
  const thetaRad = Math.atan2(height, width);
  const targetProj = diagLen * 0.88;

  const setFont = (pt: number) => {
    ctx.font = `${pt * PT_TO_PX}px ${WATERMARK_FONT_FAMILY}`;
  };

  // Binary-search the largest font size (10..400 pt) whose bounding box fits 88% of the diagonal.
  let lo = 10;
  let hi = 400;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    setFont(mid);
    const m = ctx.measureText(displayText);
    const bbWidth = m.width;
    const bbHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const proj = Math.hypot(bbWidth, bbHeight);
    if (proj <= targetProj) lo = mid;
    else hi = mid - 1;
  }
  const fontSizePt = lo;
  setFont(fontSizePt);

  // Centre the text's bounding box on the image centre, once per diagonal ("\" then "/").
  const m = ctx.measureText(displayText);
  const yOffset = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const angle of [thetaRad, -thetaRad]) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.fillText(displayText, 0, yOffset);
    ctx.restore();
  }

  return { fontSizePt, angleDeg: (thetaRad * 180) / Math.PI, displayText };
}
