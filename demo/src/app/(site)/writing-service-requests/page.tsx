"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loading, PageTitle, SourceNote, StatusBadge } from "@/components/ui";
import { formatDateTime, humanize } from "@/lib/format";
import { useDemo } from "@/lib/store";

/** templates/WritingServiceRequests/index.php — the logged-in client's own requests, newest first. */
export default function MyRequestsPage() {
  const s = useDemo();
  const router = useRouter();
  if (!s) return <Loading />;

  const mine = s.requests
    .filter((r) => r.user_id === s.clientId && !r.is_deleted)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <PageTitle title="My Writing Service Requests" />

      <div className="mb-8 flex flex-col gap-4 rounded-lg bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Actions</h2>
          <p className="mt-1 text-sm text-gray-600">Create a new writing service request or manage existing ones.</p>
        </div>
        <Link href="/writing-service-requests/add" className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          Request New Writing Service
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h3 className="text-lg font-medium text-gray-900">No writing service requests</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new writing service request.</p>
          <Link href="/writing-service-requests/add" className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Create New Request
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                {["Request ID", "Service", "Status", "Created"].map((h) => (
                  <th key={h} scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mine.map((r) => {
                const href = `/writing-service-requests/view/${r.writing_service_request_id}`;
                return (
                  <tr
                    key={r.writing_service_request_id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => router.push(href)}
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-blue-600">
                      <Link href={href} onClick={(e) => e.stopPropagation()}>
                        {r.writing_service_request_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="font-medium">{r.service_title}</div>
                      <div className="text-xs text-gray-500">{humanize(r.service_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={r.request_status} />
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{formatDateTime(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SourceNote files={["src/Controller/WritingServiceRequestsController.php → index()", "templates/WritingServiceRequests/index.php"]} />
    </div>
  );
}
