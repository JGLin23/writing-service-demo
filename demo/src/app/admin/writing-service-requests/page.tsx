"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loading, SourceNote, StatusBadge } from "@/components/ui";
import { formatDate, humanize, isoDay, money } from "@/lib/format";
import { useDemo } from "@/lib/store";

/** Admin\WritingServiceRequestsController::index() + templates/Admin/WritingServiceRequests/index.php */
export default function WritingServiceManagementPage() {
  const s = useDemo();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [status, setStatus] = useState("");

  if (!s) return <Loading />;

  const requests = s.requests.filter((r) => !r.is_deleted).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.request_status === "pending").length;
  const inProgressRequests = requests.filter((r) => r.request_status === "in_progress").length;
  const totalRevenue = s.payments.filter((p) => p.status === "paid").reduce((t, p) => t + p.amount, 0);

  const client = (id: string) => s.users.find((u) => u.user_id === id);
  const paidFor = (id: string) =>
    s.payments.filter((p) => p.writing_service_request_id === id && p.status === "paid").reduce((t, p) => t + p.amount, 0);

  // filterRequests(): status, created date and keyword (title, client, service type), all client-side.
  const term = q.trim().toLowerCase();
  const visible = requests.filter((r) => {
    if (status && r.request_status !== status) return false;
    if (createdDate && isoDay(r.created_at) !== createdDate) return false;
    if (term) {
      const u = client(r.user_id);
      const hay = [r.service_title, `${u?.first_name ?? ""} ${u?.last_name ?? ""}`, humanize(r.service_type)].join(" ").toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const stats = [
    { value: String(totalRequests), label: "Total Requests", cls: "bg-cyan-600" },
    { value: money(totalRevenue), label: "Total Revenue", cls: "bg-emerald-600" },
    { value: String(pendingRequests), label: "Pending Requests", cls: "bg-amber-500" },
    { value: String(inProgressRequests), label: "In Progress", cls: "bg-blue-600" },
  ];

  const open = (id: string) => router.push(`/admin/writing-service-requests/view/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-sm font-bold text-blue-700">✎ Writing Service Management</h1>
        <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
          <Link href="/admin" className="text-blue-700 hover:underline">
            Dashboard
          </Link>{" "}
          / Writing Requests
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className={`rounded-lg p-4 text-white shadow-sm ${st.cls}`}>
            <p className="text-2xl font-bold tabular-nums">{st.value}</p>
            <p className="text-sm opacity-90">{st.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-blue-700">Filter Requests</h2>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="mb-1 block text-sm text-slate-700">
              Search Keywords
            </label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, content, etc."
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="created_date" className="mb-1 block text-sm text-slate-700">
              Created Date
            </label>
            <input
              id="created_date"
              type="date"
              value={createdDate}
              onChange={(e) => setCreatedDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm text-slate-700">
              Status
            </label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCreatedDate("");
                setStatus("");
              }}
              className="rounded bg-slate-500 px-4 py-2 text-sm text-white hover:bg-slate-600"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-blue-700">All Writing Service Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {["Request ID", "Title", "Client", "Service Type", "Amount Paid", "Status", "Created"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No writing service requests found
                  </td>
                </tr>
              ) : (
                visible.map((r) => {
                  const u = client(r.user_id);
                  const paid = paidFor(r.writing_service_request_id);
                  return (
                    <tr
                      key={r.writing_service_request_id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View request ${r.writing_service_request_id}`}
                      className="cursor-pointer hover:bg-slate-50 focus:bg-blue-50"
                      onClick={() => open(r.writing_service_request_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open(r.writing_service_request_id);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-bold whitespace-nowrap text-blue-700">{r.writing_service_request_id}</td>
                      <td className="px-4 py-3 font-semibold">{r.service_title}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u?.first_name} {u?.last_name}
                      </td>
                      <td className="max-w-xs px-4 py-3">{humanize(r.service_type || "Other")}</td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {paid > 0 ? <span className="font-bold text-emerald-700">{money(paid)}</span> : <span className="text-slate-400">$0.00</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.request_status} variant="admin" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SourceNote
        files={["src/Controller/Admin/WritingServiceRequestsController.php → index()", "templates/Admin/WritingServiceRequests/index.php (filterRequests)"]}
      />
    </div>
  );
}
