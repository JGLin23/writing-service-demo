import type { Metadata } from "next";
import { AdminSidebar } from "@/components/AdminSidebar";
import { FlashMessages } from "@/components/Notices";

export const metadata: Metadata = { title: "Admin" };

/** templates/layout/admin.php + element/admin/sidebar.php */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-slate-100 md:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold text-slate-800">Admin area</p>
          <p className="text-xs text-slate-500">
            Viewing as: <span className="font-medium text-slate-700">Studio Admin</span>
          </p>
        </header>
        <main className="px-4 py-6 sm:px-6">
          <FlashMessages />
          {children}
        </main>
      </div>
    </div>
  );
}
