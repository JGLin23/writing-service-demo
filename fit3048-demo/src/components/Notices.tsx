"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type FlashKind = "success" | "error" | "info" | "warning";

interface Flash {
  id: number;
  kind: FlashKind;
  text: string;
}

interface Toast {
  id: number;
  title: string;
  text: string;
}

interface NoticeApi {
  /** Like $this->Flash->success() etc.: shown at the top of the next page. */
  flash: (kind: FlashKind, text: string) => void;
  /** Mock of an email the original app would send through PaymentMailer. */
  email: (text: string) => void;
  /** Small transient toast (e.g. "New message from admin"). */
  toast: (title: string, text?: string) => void;
}

const NoticeContext = createContext<NoticeApi | null>(null);
const FlashListContext = createContext<{ flashes: Flash[]; dismiss: (id: number) => void } | null>(null);

let seq = 0;

export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  const lastFlashAt = useRef(0);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const dismiss = useCallback((id: number) => setFlashes((f) => f.filter((x) => x.id !== id)), []);

  const pushToast = useCallback((title: string, text: string) => {
    const id = ++seq;
    setToasts((t) => [...t.slice(-3), { id, title, text }]);
    timers.current.push(window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500));
  }, []);

  const api = useMemo<NoticeApi>(
    () => ({
      flash: (kind, text) => {
        const id = ++seq;
        // Flashes from one action are shown together; a later action replaces them (CakePHP shows each flash once).
        const now = Date.now();
        const sameAction = now - lastFlashAt.current < 300;
        lastFlashAt.current = now;
        setFlashes((f) => (sameAction ? [...f.slice(-2), { id, kind, text }] : [{ id, kind, text }]));
        timers.current.push(window.setTimeout(() => setFlashes((f) => f.filter((x) => x.id !== id)), 7000));
      },
      email: (text) => pushToast("Mock email sent", text),
      toast: (title, text = "") => pushToast(title, text),
    }),
    [pushToast],
  );

  return (
    <NoticeContext.Provider value={api}>
      <FlashListContext.Provider value={{ flashes, dismiss }}>
        {children}
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
              <p className="font-semibold">{t.title}</p>
              {t.text && <p className="mt-0.5 text-slate-300">{t.text}</p>}
            </div>
          ))}
        </div>
      </FlashListContext.Provider>
    </NoticeContext.Provider>
  );
}

export function useNotices(): NoticeApi {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotices must be used inside NoticeProvider");
  return ctx;
}

const flashStyles: Record<FlashKind, string> = {
  success: "border-green-300 bg-green-50 text-green-800",
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
};

/** Renders pending flash messages, like <?= $this->Flash->render() ?>. */
export function FlashMessages() {
  const ctx = useContext(FlashListContext);
  if (!ctx || ctx.flashes.length === 0) return null;
  return (
    <div className="mb-4 space-y-2" role="status">
      {ctx.flashes.map((f) => (
        <div key={f.id} className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${flashStyles[f.kind]}`}>
          <span>{f.text}</span>
          <button type="button" onClick={() => ctx.dismiss(f.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
