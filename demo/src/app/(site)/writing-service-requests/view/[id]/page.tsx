"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ClientChat } from "@/components/Chat";
import { useNotices } from "@/components/Notices";
import { Loading, NotFound, SourceNote, StatusBadge } from "@/components/ui";
import { addDocument, ALLOWED_DOC_TYPES } from "@/lib/actions";
import { fileSize, formatDateTime, humanize, money, ucfirstSpaced } from "@/lib/format";
import { useDemo } from "@/lib/store";

/** templates/WritingServiceRequests/view.php */
export default function ClientRequestViewPage() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  const notices = useNotices();
  const [fileKey, setFileKey] = useState(0);

  if (!s) return <Loading />;
  const r = s.requests.find((x) => x.writing_service_request_id === id && !x.is_deleted);
  if (!r || r.user_id !== s.clientId) return <NotFound what="Writing service request" />;

  const payments = s.payments
    .filter((p) => p.writing_service_request_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((t, p) => t + p.amount, 0);
  const docs = s.documents
    .filter((d) => d.writing_service_request_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

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
    addDocument(id, { name: f.name, size: f.size, type: f.type }, "customer");
    notices.flash("success", "Document uploaded successfully.");
    setFileKey((k) => k + 1);
  };

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/writing-service-requests" className="text-indigo-600 hover:text-indigo-800">
          ← Back to My Requests
        </Link>
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4">
              <h1 className="text-xl font-bold text-white">Writing Service Request Details</h1>
              <StatusBadge status={r.request_status} />
            </div>
            <div className="p-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">{r.service_title}</h2>
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-medium">Request ID:</span> {r.writing_service_request_id}
              </p>
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-medium">Type:</span> {humanize(r.service_type)}
              </p>
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-medium">Created:</span> {formatDateTime(r.created_at)}
              </p>
            </div>
          </div>

          <ClientChat key={id} requestId={id} />
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-3">
              <h2 className="text-lg font-bold text-white">Request Status</h2>
            </div>
            <dl className="space-y-2 p-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Current Status:</dt>
                <dd className="font-semibold">{ucfirstSpaced(r.request_status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Paid:</dt>
                <dd className="font-semibold">{money(totalPaid)}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-3">
              <h2 className="text-lg font-bold text-white">Payment History</h2>
              {payments.length > 0 && <span className="rounded-full bg-white/20 px-2 text-xs text-white">{payments.length}</span>}
            </div>
            <div className="p-6">
              {payments.length === 0 ? (
                <div className="text-center text-sm">
                  <p className="font-medium text-gray-900">No payment requests yet</p>
                  <p className="text-gray-500">Payment requests will appear here</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm">
                  {payments.map((p) => (
                    <li key={p.writing_service_payment_id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-semibold">{money(p.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(p.created_at)}</p>
                      </div>
                      {p.status === "paid" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Paid</span>
                      ) : (
                        <span className="text-right">
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">Pending</span>
                          <span className="mt-0.5 block text-xs text-gray-500">Awaiting payment</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-md">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-500 px-6 py-3">
              <h2 className="text-lg font-bold text-white">Documents</h2>
              {docs.length > 0 && <span className="rounded-full bg-white/20 px-2 text-xs text-white">{docs.length}</span>}
            </div>
            <div className="space-y-4 p-6">
              <form onSubmit={onUpload} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Upload Document</h3>
                <input key={fileKey} name="document" type="file" accept=".pdf,.doc,.docx" className="block w-full text-sm" aria-label="Document to upload" />
                <button type="submit" className="w-full rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                  Upload
                </button>
              </form>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Uploaded Documents</h3>
                {r.document && (
                  <p className="mt-2 text-sm text-gray-700">
                    📄 {r.document.name} <span className="text-xs text-gray-500">({fileSize(r.document.size)}, with the request)</span>
                  </p>
                )}
                {docs.length === 0 && !r.document ? (
                  <p className="mt-2 text-sm text-gray-500">No documents</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {docs.map((d) => (
                      <li key={d.request_document_id}>
                        📄 {d.document_name}{" "}
                        <span className="text-xs text-gray-500">
                          ({fileSize(d.file_size)}, {d.uploaded_by === "admin" ? "from admin" : "from you"})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SourceNote
        files={[
          "src/Controller/WritingServiceRequestsController.php → view(), getMessages(), uploadDocument()",
          "templates/WritingServiceRequests/view.php (refreshChat every 10 s)",
          "templates/WritingServiceRequests/messages_only.php",
        ]}
      />
    </div>
  );
}
