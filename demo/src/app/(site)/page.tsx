import Link from "next/link";

const features = [
  {
    n: "1",
    title: "Writing service & admin dashboard",
    body: "Clients request writing, editing or proofreading. The admin manages every request from one dashboard.",
    points: [
      "Request form with the original validation rules (title ≤ 100, service type ≤ 200, notes ≤ 1,000 characters, PDF or Word only)",
      "My Requests list with readable IDs like R-KT48213",
      "Admin stats, live search and filters, status updates and payment requests",
    ],
    links: [
      { href: "/writing-service-requests/add", label: "Request a writing service" },
      { href: "/admin/writing-service-requests", label: "Admin: Writing Services" },
    ],
  },
  {
    n: "2",
    title: "Client–admin chat",
    body: "Every request has its own conversation between the client and the admin.",
    points: [
      "The client page checks for new messages every 10 seconds",
      "Admin replies are sent over AJAX and appear without a page reload",
      "Status updates and payment requests are posted into the chat, and a mock checkout marks payments as paid",
    ],
    links: [{ href: "/chat", label: "Open both sides side by side" }],
  },
  {
    n: "3",
    title: "Photo sales with watermarking",
    body: "A gallery of limited-edition prints. Every uploaded photo is watermarked before the shop shows it.",
    points: [
      "Gallery with All, For Sale and Sold filters, and a detail page with an edition counter and size/print picker",
      "Upload a JPEG and the watermark is drawn along both diagonals (ported from the PHP GD code)",
      "The watermark text is editable under Content Blocks",
    ],
    links: [
      { href: "/artworks", label: "Gallery" },
      { href: "/admin/artworks/add", label: "Admin: upload & watermark" },
    ],
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="max-w-3xl">
        <p className="text-xs font-semibold tracking-wider text-indigo-700 uppercase">FIT3048 · Team 123 · Industry project</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          My parts of a photography and writing-services website
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Our student team built this site for a real client, an artist and writer. The original runs on CakePHP 5, PHP and MySQL. This page is a
          standalone Next.js and TypeScript demo of <strong>only the three parts I built</strong>, running on mock data in your browser.
        </p>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3" aria-label="Features">
        {features.map((f) => (
          <article key={f.n} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{f.n}</span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            <ul className="mt-4 flex-1 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              {f.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              {f.links.map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={
                    i === 0
                      ? "rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
                      : "rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  }
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Suggested 2-minute walkthrough</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>
              <Link className="text-indigo-700 underline" href="/writing-service-requests/add">
                Request a writing service
              </Link>{" "}
              and submit it. It appears at the top of My Requests as <em>Pending</em>.
            </li>
            <li>
              Open{" "}
              <Link className="text-indigo-700 underline" href="/admin/writing-service-requests">
                Admin → Writing Services
              </Link>
              : the stats update. Type in Search Keywords and the table filters live.
            </li>
            <li>
              Open{" "}
              <Link className="text-indigo-700 underline" href="/chat">
                the chat
              </Link>
              : reply as admin with Ctrl+Enter, then watch the client side pick it up within 10 seconds.
            </li>
            <li>
              <Link className="text-indigo-700 underline" href="/admin/artworks/add">
                Upload a JPEG
              </Link>
              , open it from the Artworks list to compare the original with the watermarked copy, then view it in the{" "}
              <Link className="text-indigo-700 underline" href="/artworks">
                gallery
              </Link>
              .
            </li>
          </ol>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">What&rsquo;s real and what&rsquo;s mocked</h2>
          <p className="mt-3">
            <strong>Same as the original:</strong> the screens and flows, validation rules, message texts, status rules, and the watermark algorithm
            (ported from PHP GD to the browser canvas).
          </p>
          <p className="mt-2">
            <strong>Mocked:</strong> MySQL (browser storage), emails (shown as notifications), Stripe (a mock checkout with no card details), Cloudflare
            R2 (browser storage) and logins (fixed demo users).
          </p>
          <p className="mt-2">
            <strong>Not included:</strong> parts built by teammates, such as the cart and checkout, orders, coaching services, calendar booking and
            two-factor login.
          </p>
          <p className="mt-2 text-slate-500">All people, requests and artworks are fictional. The sample artworks are generated in the browser.</p>
        </div>
      </section>
    </div>
  );
}
