"use client";

import { useSyncExternalStore } from "react";
import { createSeedState, STATE_VERSION } from "./seed";
import type { DemoState } from "./types";

/**
 * A tiny client-side store standing in for the MySQL database.
 * State lives in localStorage, so two browser windows (client + admin)
 * see the same data. The `storage` event keeps other tabs in sync.
 */
const KEY = "fit3048-demo-state";

let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed && parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    // Private mode or blocked storage: fall back to fresh seed data.
  }
  const seeded = createSeedState();
  persist(seeded);
  return seeded;
}

function persist(s: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked: the demo keeps working in memory.
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): DemoState {
  if (!state) state = load();
  return state;
}

export function update(mutator: (draft: DemoState) => void): void {
  const next = structuredClone(getState());
  mutator(next);
  state = next;
  persist(next);
  emit();
}

export function resetState(): void {
  state = createSeedState();
  persist(state);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = null;
      emit();
    }
  });
}

/**
 * Returns the demo state, or null during server render / hydration
 * (the data only exists in the browser).
 */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(
    subscribe,
    () => getState(),
    () => null,
  );
}
