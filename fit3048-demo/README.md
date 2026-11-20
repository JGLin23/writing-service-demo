# FIT3048 demo: my parts only

A standalone **Next.js + React + TypeScript** demo of the three parts I built for our FIT3048 team project: a photography-sales and writing-services website for a real client. The original runs on CakePHP 5, PHP and MySQL.

1. **Writing service and admin dashboard**
2. **Client–admin chat** on each writing request
3. **Photo sales with watermarking**

It uses **mock data only**. There is no database, no login and no passwords, and no real client or user data. All people, requests and artworks are fictional, and the sample artworks are generated in the browser.

## Run it locally

You need Node.js 18.18 or later. It was tested with Node 24.

```powershell
npm install
```

```powershell
npm run dev
```

Then open http://localhost:3000.

To check a production build:

```powershell
npm run build
```

```powershell
npm start
```

## Deploy to Vercel

There are two ways. No environment variables or extra config are needed.

**A: through GitHub (recommended)**

1. Push this folder to a new GitHub repository.
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Vercel detects Next.js automatically. Click **Deploy**.

**B: from this folder with the Vercel CLI**

```powershell
npx vercel
```

```powershell
npx vercel --prod
```

The first command asks you to log in and link a project. The second publishes the production URL.

## Pages

| Feature | Demo page | Original CakePHP code |
|---|---|---|
| Home | `/` | none |
| Writing service form | `/writing-service-requests/add` | `WritingServiceRequestsController::add()`, `templates/WritingServiceRequests/add.php` |
| My requests | `/writing-service-requests` | `WritingServiceRequestsController::index()` |
| Client request and chat | `/writing-service-requests/view/R-KT48213` | `WritingServiceRequestsController::view()`, `getMessages()`, `templates/WritingServiceRequests/view.php` |
| Mock checkout | `/writing-service-requests/pay/{id}/{paymentId}` | stands in for `pay()` → Stripe → `paymentSuccess()` |
| Admin dashboard | `/admin` | `Admin\AdminController::dashboard()` |
| Admin writing services | `/admin/writing-service-requests` | `Admin\WritingServiceRequestsController::index()` |
| Admin request and chat | `/admin/writing-service-requests/view/R-KT48213` | `Admin\WritingServiceRequestsController::view()`, `sendMessage()`, `updateStatus()`, `sendPaymentRequest()` |
| Both chat sides at once | `/chat` | demo-only page that combines the two chat panels |
| Gallery | `/artworks` | `ArtworksController::index()`, `templates/Artworks/index.php` |
| Photo detail | `/artworks/view/a-harbour` | `ArtworksController::view()`, `templates/Artworks/view.php` |
| Admin artworks | `/admin/artworks` (add / edit) | `Admin\ArtworksController` |
| Watermark text | `/admin/content-blocks` | content block `watermark-text` |

Every page ends with a note naming the original files it is based on.

## 2-minute demo script

1. **Home (10 s):** "These are the three parts I built. The original is CakePHP and MySQL; this is a Next.js demo on mock data."
2. **Writing service (30 s):** open *Request a writing service*.
   - Click Submit with the form empty to show the validation messages.
   - Fill it in and submit. The new request appears in My Requests as *Pending*, with an ID like `R-AB12345`.
3. **Admin dashboard (25 s):** open *Admin → Writing Services*.
   - The stats cards now include the new request.
   - Type in Search Keywords and the table filters live.
   - Open the request.
4. **Chat (30 s):** open `/chat`.
   - Type a reply on the admin side and press Ctrl+Enter. It appears straight away.
   - Within 10 seconds the client side refreshes and shows "New message from admin".
   - Click **Make Payment** on R-KT48213, then **Simulate successful payment**. The payment shows as Paid and a confirmation message is added to the chat.
5. **Watermark (25 s):** open *Admin → Artworks → Add New Artwork*.
   - Upload any JPEG of your own and save.
   - Open the artwork from the list: the panel shows the original and the watermarked copy side by side.
   - Point out the X-shaped watermark and the font size chosen by binary search. Then show the gallery.

Use **Reset demo data** in the top bar to start fresh before an interview.

## What's real and what's mocked

| Same as the original | Mocked |
|---|---|
| Screens, flows and button and message texts | MySQL: browser `localStorage` (shared across tabs) |
| Validation rules (title ≤ 100, type ≤ 200, notes ≤ 1,000; PDF/DOC/DOCX only; JPEG only for artworks) | Emails: shown as "Mock email sent" notifications |
| Request IDs `R-XX12345`; pending → in progress on the first admin reply | Stripe Checkout: mock page, no card details |
| Status-update and payment-request message texts, `[PAYMENT_BUTTON]` / `[PAYMENT_CONFIRMATION]` rendering | Cloudflare R2 and `webroot/img`: browser IndexedDB |
| Client chat refresh every 10 s; admin page with no polling | Login: fixed demo users (Alex Chen as client, Studio Admin) |
| Watermark algorithm (`_drawCornerDiagonalText`) ported from PHP GD to the Canvas API, same font | Orders: a `sold_copies` number per artwork |

**Differences worth knowing**

- In the original, `getMessages()` reads the rendered HTML with `getBody()->getContents()`. That may return an empty string, because the stream isn't rewound. This demo implements the intended behaviour, so check the real app's auto-refresh before claiming it works there.
- The admin page's "New" badge doesn't show in practice, in either version. `view()` marks the client's messages as read on the same objects before the page renders.
- Not included: parts built by teammates (cart and checkout, orders, coaching services, calendar and time slots, two-factor login).

## Tech

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Canvas 2D API · IndexedDB · `localStorage` with cross-tab sync. There are no other runtime dependencies.

The watermark font `public/fonts/MPLUSRounded1c-Medium.ttf` is the same file the original project uses. M PLUS Rounded 1c is licensed under the SIL Open Font License 1.1.
