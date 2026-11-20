"use client";

/**
 * Stand-in for the two image locations in the original project:
 *   "{id}.jpg"    -> webroot/img/Artworks/{id}.jpg (original, shown in the admin list)
 *   "{id}_wm.jpg" -> Cloudflare R2 object served by the CDN (watermarked, shown publicly)
 * Stored in IndexedDB so images survive reloads; falls back to memory if IndexedDB is unavailable.
 */
const DB_NAME = "fit3048-demo-images";
const STORE = "images";
const memory = new Map<string, Blob>();

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putImage(key: string, blob: Blob): Promise<void> {
  memory.set(key, blob);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function getImage(key: string): Promise<Blob | undefined> {
  if (memory.has(key)) return memory.get(key);
  const db = await openDb();
  if (!db) return undefined;
  const blob = await new Promise<Blob | undefined>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => resolve(undefined);
  });
  db.close();
  if (blob) memory.set(key, blob);
  return blob;
}

export async function clearImages(): Promise<void> {
  memory.clear();
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export const originalKey = (id: string) => `${id}.jpg`;
export const watermarkedKey = (id: string) => `${id}_wm.jpg`;
