import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/format";
import type { WritingServicePayment } from "@/lib/types";

/**
 * Renders a chat message the way the original templates do:
 *   nl2br(h($message)) then **bold** -> <strong>, plus the special tags
 *   [PAYMENT_BUTTON]id[/PAYMENT_BUTTON] and [PAYMENT_CONFIRMATION]...
 * React escapes all text, matching h(); no HTML from messages is injected.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`}>{p}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

interface Props {
  text: string;
  side: "client" | "admin";
  payments: WritingServicePayment[];
  /** Client side: where "Make Payment" goes (the mock Stripe Checkout page). */
  payHref?: (paymentId: number) => string;
}

export function MessageText({ text, side, payments, payHref }: Props) {
  // [PAYMENT_CONFIRMATION] — the controller writes it without a closing tag; the admin template's version has one.
  if (text.includes("[PAYMENT_CONFIRMATION]")) {
    const body = text
      .replace("[PAYMENT_CONFIRMATION]", "")
      .replace("[/PAYMENT_CONFIRMATION]", "")
      .trim();
    if (side === "admin") {
      return (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
            <span aria-hidden>✓</span> Payment received
          </p>
          <div className="whitespace-pre-wrap text-sm">{inline(body, "pc")}</div>
        </div>
      );
    }
    return <div className="whitespace-pre-wrap">{inline(body, "pc")}</div>;
  }

  const match = text.match(/\[PAYMENT_BUTTON\]([\s\S]*?)\[\/PAYMENT_BUTTON\]/);
  if (match) {
    const before = text.slice(0, match.index).replace(/\s+$/, "");
    const after = text.slice((match.index ?? 0) + match[0].length).trim();
    const paymentId = Number(match[1]);
    const payment = payments.find((p) => p.writing_service_payment_id === paymentId);
    const isPaid = payment?.status === "paid";

    const control =
      side === "admin" ? (
        <div className="mt-2" data-payment-container={paymentId}>
          <span className="text-xs text-slate-500">Payment request status:</span>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              disabled
              className={`rounded px-2.5 py-1 text-xs font-semibold ${isPaid ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}
            >
              {isPaid ? "✓ Payment Complete" : "Payment Button"}
            </button>
            <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
              {isPaid ? "PAID" : "PENDING"}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3" data-payment-container={paymentId}>
          {isPaid ? (
            <span className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-sm font-medium text-white">
              ✓ Payment Complete
            </span>
          ) : payHref ? (
            <Link
              href={payHref(paymentId)}
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Make Payment
            </Link>
          ) : null}
          <p className="mt-1 text-xs opacity-80">
            {isPaid ? `Paid ${formatDateTime(payment?.payment_date)}` : "Awaiting payment"}
          </p>
        </div>
      );

    return (
      <div>
        {before && <div className="whitespace-pre-wrap">{inline(before, "b")}</div>}
        {control}
        {after && <div className="mt-2 whitespace-pre-wrap">{inline(after, "a")}</div>}
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{inline(text, "t")}</div>;
}
