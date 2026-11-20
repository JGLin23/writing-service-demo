const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** PHP number_format($n, 2) with a leading "$". */
export function money(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return "$" + v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Number without currency, as $this->Number->format() renders it. */
export function plainNumber(n: number): string {
  return n.toLocaleString("en-AU", { maximumFractionDigits: 2 });
}

/** Matches PHP date format 'M d, Y H:i'. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

/** yyyy-mm-dd in local time, for the admin "Created Date" filter. */
export function isoDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Cake\Utility\Inflector::humanize: "in_progress" -> "In Progress". */
export function humanize(s: string): string {
  return s
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** ucfirst(str_replace('_', ' ', $status)): "in_progress" -> "In progress". */
export function ucfirstSpaced(s: string): string {
  const t = s.replace(/_/g, " ");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function monthLabel(index: number): string {
  return MONTHS[index];
}
