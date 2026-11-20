"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RevenueChart } from "@/components/RevenueChart";
import { Loading, SourceNote, StatusBadge } from "@/components/ui";
import { formatDate, humanize } from "@/lib/format";
import { useDemo } from "@/lib/store";

/** Admin\AdminController::dashboard() + templates/Admin/Admin/dashboard.php (writing-service parts only). */
export default function AdminDashboardPage() {
  const s = useDemo();
  const router = useRouter();
  if (!s) return <Loading />;

  const reqs = s.requests.filter((r) => !r.is_deleted);
  const pendingQuotesCount = reqs.filter((r) => r.request_status === "pending").length;
  const upcomingBookingsCount = reqs.filter((r) => r.request_status === "in_progress").length;
  const completedServicesCount = reqs.filter((r) => r.request_status === "completed").length;

  const recentRequests = [...s.requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  // SUM(final_price) grouped by MONTH(created_at) for the last 12 months, excluding status 'cancelled'.
  const firstOfPeriod = new Date();
  firstOfPeriod.setDate(1);
  firstOfPeriod.setHours(0, 0, 0, 0);
  firstOfPeriod.setMonth(firstOfPeriod.getMonth() - 11);
  const monthlyWritingData = Array<number>(12).fill(0);
  s.requests.forEach((r) => {
    const d = new Date(r.created_at);
    if (d >= firstOfPeriod && r.request_status !== ("cancelled" as string)) {
      monthlyWritingData[d.getMonth()] += r.final_price ?? 0;
    }
  });

  const userName = (id: string) => {
    const u = s.users.find((x) => x.user_id === id);
    return u ? `${u.first_name} ${u.last_name}` : "Unknown";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-blue-700">Revenue Overview</h2>
          <RevenueChart data={monthlyWritingData} title="Writing Services revenue by month (sum of final price, last 12 months)" />
          <p className="mt-2 text-xs text-slate-500">
            The original chart also has an &ldquo;Artwork Sales&rdquo; line from the orders module, which a teammate built, so it is left out here.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-blue-700">Business Statistics</h2>
          <h3 className="text-sm font-bold text-slate-800">Writing Services</h3>
          <div className="mt-3 grid grid-cols-3 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-500">{pendingQuotesCount}</p>
              <p className="text-xs text-slate-600">Quotes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-600">{upcomingBookingsCount}</p>
              <p className="text-xs text-slate-600">Bookings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{completedServicesCount}</p>
              <p className="text-xs text-slate-600">Completed</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">Quotes = pending, Bookings = in progress, Completed = completed (as counted in dashboard()).</p>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold text-blue-700">Recent Service Requests</h2>
          <Link href="/admin/writing-service-requests" className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {["Request #", "Client", "Service Type", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.map((r) => (
                <tr
                  key={r.writing_service_request_id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/admin/writing-service-requests/view/${r.writing_service_request_id}`)}
                >
                  <td className="px-4 py-2 font-medium text-blue-700">
                    <Link href={`/admin/writing-service-requests/view/${r.writing_service_request_id}`} onClick={(e) => e.stopPropagation()}>
                      #{r.writing_service_request_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{userName(r.user_id)}</td>
                  <td className="max-w-xs truncate px-4 py-2">{humanize(r.service_type)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.request_status} variant="admin" />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SourceNote files={["src/Controller/Admin/AdminController.php → dashboard(), checkAdminAuth()", "templates/Admin/Admin/dashboard.php"]} />
    </div>
  );
}
