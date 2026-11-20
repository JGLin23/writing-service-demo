"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminChat, ClientChat } from "@/components/Chat";
import { Loading, SourceNote, StatusBadge } from "@/components/ui";
import { useDemo } from "@/lib/store";

/**
 * Demo-only page: both sides of the same conversation side by side, so the chat
 * can be shown in one window. Each panel is the same component as on its full page.
 */
export default function ChatDemoPage() {
  const s = useDemo();
  const [selected, setSelected] = useState<string>("");
  const [adminReload, setAdminReload] = useState(0);

  if (!s) return <Loading />;

  const mine = s.requests
    .filter((r) => r.user_id === s.clientId && !r.is_deleted)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const requestId = selected || mine.find((r) => r.writing_service_request_id === "R-KT48213")?.writing_service_request_id || mine[0]?.writing_service_request_id;
  const request = mine.find((r) => r.writing_service_request_id === requestId);

  if (!request) {
    return (
      <p className="text-slate-600">
        No requests for the demo client yet.{" "}
        <Link className="text-indigo-700 underline" href="/writing-service-requests/add">
          Create one
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Client–admin chat</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Both sides of one request&rsquo;s conversation. Send as the admin (right) and the client page (left) picks it up on its next 10-second refresh.
        The admin page has no auto-refresh in the original, so reload it to see new client messages.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="req" className="text-sm font-medium text-slate-700">
          Request
        </label>
        <select
          id="req"
          value={request.writing_service_request_id}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          {mine.map((r) => (
            <option key={r.writing_service_request_id} value={r.writing_service_request_id}>
              {r.writing_service_request_id} · {r.service_title}
            </option>
          ))}
        </select>
        <StatusBadge status={request.request_status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-label="Client side">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Client page (Alex Chen)</h2>
            <Link href={`/writing-service-requests/view/${request.writing_service_request_id}`} className="text-xs text-indigo-700 underline">
              Open full client page
            </Link>
          </div>
          <ClientChat key={`c-${request.writing_service_request_id}`} requestId={request.writing_service_request_id} />
        </section>

        <section aria-label="Admin side">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Admin page</h2>
            <span className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAdminReload((k) => k + 1)}
                className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                ↻ Reload admin page
              </button>
              <Link href={`/admin/writing-service-requests/view/${request.writing_service_request_id}`} className="text-xs text-indigo-700 underline">
                Open full admin page
              </Link>
            </span>
          </div>
          <AdminChat key={`a-${request.writing_service_request_id}`} requestId={request.writing_service_request_id} reloadKey={adminReload} />
        </section>
      </div>

      <div className="mt-2 grid gap-4 text-sm text-slate-700 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Client side</h3>
          <p className="mt-1">
            Posts the form and reloads with &ldquo;Message sent successfully.&rdquo; Every 10 s it calls <code className="text-xs">getMessages()</code> and shows a
            toast when admin messages arrive.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Admin side</h3>
          <p className="mt-1">
            Sends over AJAX to <code className="text-xs">sendMessage()</code> and appends the message straight away. The first reply moves a pending request to
            in progress.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Special messages</h3>
          <p className="mt-1">
            Payment requests become a <em>Make Payment</em> button for the client and a PAID or PENDING badge for the admin. Try paying the R-KT48213 request.
          </p>
        </div>
      </div>

      <SourceNote
        files={[
          "templates/WritingServiceRequests/view.php + messages_only.php (client)",
          "templates/Admin/WritingServiceRequests/view.php (admin)",
          "src/Model/Table/RequestMessagesTable.php",
        ]}
      />
    </div>
  );
}
