"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminChat } from "@/components/Chat";
import { useNotices } from "@/components/Notices";
import { Loading, NotFound, SourceNote, StatusBadge } from "@/components/ui";
import { addDocument, ALLOWED_DOC_TYPES, sendPaymentRequest, updateStatus } from "@/lib/actions";
import { fileSize, formatDateTime, humanize, money } from "@/lib/format";
import { useDemo } from "@/lib/store";
import type { RequestStatus } from "@/lib/types";

/** Admin\WritingServiceRequestsController::view() + templates/Admin/WritingServiceRequests/view.php */
export default function AdminRequestViewPage() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  const notices = useNotices();
  const [reloadKey, setReloadKey] = useState(0);
  const [newStatus, setNewStatus] = useState<RequestStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  if (!s) return <Loading />;
  const r = s.requests.find((x) => x.writing_service_request_id === id && !x.is_deleted);
  if (!r) return <NotFound what="Writing service request" />;

  const u = s.users.find((x) => x.user_id === r.user_id);
  const payments = s.payments
    .filter((p) => p.writing_service_request_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const docs = s.documents.filter((d) => d.writing_service_request_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const selectedStatus = newStatus || r.request_status;

  /** Form POST + redirect back to view#messages: the page (and the chat) reloads. */
  const reloadPage = () => setReloadKey((k) => k + 1);

  const onUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus(id, selectedStatus);
    notices.flash("success", "The request status has been updated.");
    notices.flash("info", "Status change notification sent to client.");
    setNewStatus("");
    reloadPage();
  };

  const onUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("document") as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) {
      notices.flash("error", "No document uploaded or upload failed.");
      return;
    }
    if (!ALLOWED_DOC_TYPES.includes(f.type)) {
      notices.flash("error", "Invalid file type. Please upload PDF or Word documents only.");
      return;
    }
    addDocument(id, { name: f.name, size: f.size, type: f.type }, "admin");
    notices.flash("success", "Document uploaded successfully.");
    setFileKey((k) => k + 1);
  };

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/admin/writing-service-requests" className="text-blue-700 hover:underline">
          ← Back to Writing Requests
        </Link>
      </p>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-bold text-blue-700">Request Information</h2>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                ID: <span className="font-mono font-semibold text-slate-700">{r.writing_service_request_id}</span>
                <StatusBadge status={r.request_status} variant="admin" />
              </span>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{r.service_title}</h3>
                <p className="mt-1 text-sm text-slate-600">Service Type: {humanize(r.service_type)}</p>
                <p className="text-sm text-slate-600">Created: {formatDateTime(r.created_at)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <h4 className="mb-1 font-semibold text-slate-800">Client Information</h4>
                <p>
                  {u?.first_name} {u?.last_name}
                </p>
                <p className="text-slate-600">{u?.email}</p>
              </div>
              {r.notes && (
                <div className="md:col-span-2">
                  <h4 className="mb-1 text-sm font-bold text-slate-800">Client Notes</h4>
                  <p className="rounded-md bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700">{r.notes}</p>
                </div>
              )}
              {r.document && (
                <div className="md:col-span-2">
                  <h4 className="mb-1 text-sm font-bold text-slate-800">Attached Document</h4>
                  <p className="text-sm text-slate-700">
                    📄 {r.document.name} <span className="text-xs text-slate-500">({fileSize(r.document.size)})</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          <AdminChat key={id} requestId={id} reloadKey={reloadKey} />
          <p className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            Like the original, this page doesn&rsquo;t poll for new client messages.
            <button type="button" onClick={reloadPage} className="rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-700 hover:bg-slate-50">
              ↻ Reload page
            </button>
          </p>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-blue-700">Request Actions</h2>
            <div className="space-y-5 p-4">
              <form onSubmit={onUpdateStatus}>
                <h3 className="mb-2 text-sm font-bold text-slate-800">Update Status</h3>
                <label htmlFor="status" className="sr-only">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                  className="mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Cancelled</option>
                </select>
                <button type="submit" className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  ↻ Update Status
                </button>
              </form>

              <form onSubmit={onUpload} className="border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-sm font-bold text-slate-800">Document Management</h3>
                <input key={fileKey} name="document" type="file" accept=".pdf,.doc,.docx" className="block w-full text-sm" aria-label="Document to upload" />
                <button type="submit" className="mt-2 w-full rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800">
                  Upload Document
                </button>
                {docs.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-slate-700">
                    {docs.map((d) => (
                      <li key={d.request_document_id}>
                        📄 {d.document_name} ({fileSize(d.file_size)}, {d.uploaded_by === "admin" ? "admin" : "client"})
                      </li>
                    ))}
                  </ul>
                )}
              </form>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-sm font-bold text-slate-800">Payment Options</h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded bg-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300"
                >
                  💳 Send Payment Request
                </button>
                <p className="mt-1 text-xs text-slate-500">Send a payment request link to the client</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="mb-2 flex justify-between text-sm font-bold text-slate-800">
                  <span>Payment History</span>
                  {payments.length > 0 && <span className="rounded bg-cyan-600 px-2 text-xs text-white">{payments.length}</span>}
                </h3>
                {payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payment requests yet.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-slate-200 text-left text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-2 py-1">Payment #</th>
                            <th className="px-2 py-1">Amount</th>
                            <th className="px-2 py-1">Date Created</th>
                            <th className="px-2 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.writing_service_payment_id} className={p.status === "paid" ? "bg-emerald-50" : "bg-amber-50"}>
                              <td className="px-2 py-1 font-bold">#{p.writing_service_payment_id}</td>
                              <td className="px-2 py-1 font-bold tabular-nums">{money(p.amount)}</td>
                              <td className="px-2 py-1 text-slate-500">{formatDateTime(p.created_at)}</td>
                              <td className="px-2 py-1">
                                {p.status === "paid" ? (
                                  <>
                                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">✓ Paid</span>
                                    <span className="mt-0.5 block text-[10px] text-slate-500">{formatDateTime(p.payment_date)}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">Pending</span>
                                    <span className="mt-0.5 block text-[10px] text-slate-500">Awaiting payment</span>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan={3} className="px-2 py-1 text-right font-bold">
                              Total Requests:
                            </td>
                            <td className="px-2 py-1 font-bold">{payments.length}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">✓ Paid: {paidCount}</p>
                  </>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {modalOpen && (
        <PaymentRequestModal
          defaultDescription={`Writing Service: ${r.service_title}`}
          onClose={() => setModalOpen(false)}
          onSend={(amount, description) => {
            if (!Number.isFinite(amount) || amount <= 0) {
              notices.flash("error", "Please provide a valid payment amount.");
              return;
            }
            sendPaymentRequest(id, amount, description);
            notices.flash("success", "Payment request has been sent to the client.");
            notices.email("Payment request email sent to the client (payment_request).");
            setModalOpen(false);
            reloadPage();
          }}
        />
      )}

      <SourceNote
        files={[
          "src/Controller/Admin/WritingServiceRequestsController.php → view(), sendMessage(), updateStatus(), sendPaymentRequest(), uploadDocument()",
          "templates/Admin/WritingServiceRequests/view.php (addMessageToChat, processPaymentElements)",
        ]}
      />
    </div>
  );
}

function PaymentRequestModal({
  defaultDescription,
  onClose,
  onSend,
}: {
  defaultDescription: string;
  onClose: () => void;
  onSend: (amount: number, description: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState(defaultDescription);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="paymentRequestModalLabel">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between bg-amber-400 px-4 py-3">
          <h2 id="paymentRequestModalLabel" className="font-semibold text-amber-950">
            💳 Send Payment Request
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-amber-950">
            ×
          </button>
        </div>
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSend(Number(amount), description.trim() || "Writing service fee");
          }}
        >
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium">
              Payment Amount
            </label>
            <div className="flex">
              <span className="rounded-l border border-r-0 border-slate-300 bg-slate-100 px-3 py-2 text-sm">$</span>
              <input
                id="amount"
                ref={amountRef}
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-r border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <small className="text-xs text-slate-500">Enter the amount to charge the client for this specific service.</small>
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Payment Description
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Editorial review fee, Writing consultation, Proofreading service"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <small className="text-xs text-slate-500">Briefly describe what this payment is for. This will be visible to the client.</small>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={onClose} className="rounded bg-slate-500 px-4 py-2 text-sm text-white">
              Cancel
            </button>
            <button type="submit" className="rounded bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300">
              Send Payment Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
