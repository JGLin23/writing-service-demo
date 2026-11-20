"use client";

import type { SampleArtSpec } from "./types";

/** Deterministic PRNG so each sample artwork looks the same on every machine. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Paints an abstract landscape as a stand-in for real artwork photos.
 * No client photos are bundled with this demo.
 */
export async function renderSampleArt(spec: SampleArtSpec, width = 1600, height = 1200): Promise<Blob> {
  const rand = mulberry32(spec.seed);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, spec.sky[0]);
  sky.addColorStop(0.75, spec.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sx = width * (0.25 + rand() * 0.5);
  const sy = height * (0.25 + rand() * 0.15);
  const sr = height * (0.08 + rand() * 0.05);
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3);
  glow.addColorStop(0, spec.sun);
  glow.addColorStop(0.35, spec.sun + "aa");
  glow.addColorStop(1, spec.sun + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = spec.sun;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();

  spec.hills.forEach((colour, layer) => {
    const base = height * (0.55 + layer * 0.13);
    const amp = height * (0.08 - layer * 0.015);
    const f1 = 1 + rand() * 2;
    const f2 = 3 + rand() * 4;
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const t = x / width;
      const y = base - amp * Math.sin(t * Math.PI * f1 + p1) - amp * 0.35 * Math.sin(t * Math.PI * f2 + p2);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  });

  // Light grain so the image reads as a print rather than a flat graphic.
  const grain = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (rand() - 0.5) * 14;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render sample art"))), "image/jpeg", 0.92),
  );
}
