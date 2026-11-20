import type { RequestStatus } from "@/lib/types";
import { humanize, ucfirstSpaced } from "@/lib/format";

const statusClient: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-gray-100 text-gray-800",
};

export function PageTitle({ title }: { title: string }) {
  return <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>;
}

const statusAdmin: Record<string, string> = {
  pending: "bg-amber-400 text-amber-950",
  in_progress: "bg-sky-500 text-white",
  completed: "bg-emerald-600 text-white",
  canceled: "bg-rose-600 text-white",
};

/** Status pill. Client pages use ucfirst(str_replace('_',' ')); admin pages use Inflector::humanize(). */
export function StatusBadge({ status, variant = "client" }: { status: RequestStatus; variant?: "client" | "admin" }) {
  const cls = variant === "admin" ? statusAdmin[status] : statusClient[status];
  const label = variant === "admin" ? humanize(status) : ucfirstSpaced(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls ?? "bg-gray-100 text-gray-800"}`}>
      {label}
    </span>
  );
}

/** Points at the original CakePHP file a screen is based on. */
export function SourceNote({ files }: { files: string[] }) {
  return (
    <aside className="mt-10 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600">
      <p className="font-semibold text-slate-700">Original code this screen is based on (CakePHP 5)</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 font-mono">
        {files.map((f) => (
          <li key={f} className="break-all">
            {f}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function Loading({ label = "Loading demo data…" }: { label?: string }) {
  return (
    <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500" role="status">
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}

export function NotFound({ what }: { what: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
      <p className="font-semibold text-slate-800">{what} not found</p>
      <p className="mt-1 text-sm">It may have been removed by &ldquo;Reset demo data&rdquo;.</p>
    </div>
  );
}
