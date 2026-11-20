"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useNotices } from "@/components/Notices";
import { Loading, NotFound, SourceNote } from "@/components/ui";
import { completeMockPayment } from "@/lib/actions";
import { money } from "@/lib/format";
import { useDemo } from "@/lib/store";

/**
 * Stands in for pay() -> Stripe Checkout -> paymentSuccess().
 * No card details are collected: the demo only simulates the result.
 */
export default function MockCheckoutPage() {
  const { id, paymentId } = useParams<{ id: string; paymentId: string }>();
  const router = useRouter();
  const notices = useNotices();
  const s = useDemo();
  if (!s) return <Loading />;

  const r = s.requests.find((x) => x.writing_service_request_id === id);
  const p = s.payments.find((x) => x.writing_service_payment_id === Number(paymentId) && x.writing_service_request_id === id);
  if (!r || !p || r.user_id !== s.clientId) return <NotFound what="Payment request" />;

  const back = `/writing-service-requests/view/${id}`;

  if (p.status === "paid") {
    return (
      <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow">
        <p className="font-semibold text-gray-900">Payment has already been processed.</p>
        <Link href={back} className="mt-4 inline-block text-indigo-600 underline">
          Back to the request
        </Link>
      </div>
    );
  }

  const pay = () => {
    completeMockPayment(id, p.writing_service_payment_id);
    notices.flash("success", "Payment completed successfully!");
    notices.email("Payment confirmation sent to the client, and a payment notification sent to the admin.");
    router.push(back);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Mock checkout</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{r.service_title}</h1>
        <p className="mt-4 text-3xl font-bold text-slate-900">{money(p.amount)}</p>
        <p className="text-sm text-slate-500">Payment #{p.writing_service_payment_id} for {r.writing_service_request_id}</p>

        <div className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          In the real app this button redirects to Stripe Checkout (test mode). Stripe then returns to <code className="text-xs">paymentSuccess()</code>,
          which marks the payment as paid and posts a payment confirmation into the chat. This demo skips Stripe and simulates that result.
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={pay} className="rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">
            Simulate successful payment
          </button>
          <Link href={back} className="rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </div>
      <SourceNote
        files={[
          "src/Controller/WritingServiceRequestsController.php → pay(), paymentSuccess(), _addPaymentConfirmationMessage()",
        ]}
      />
    </div>
  );
}
