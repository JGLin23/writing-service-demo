# Writing service, chat and photo sales: demo of my parts

**Live demo:** https://writing-service-demo.vercel.app

Our student team built a photography-sales and writing-services website for a real client as a university industry team project. The original runs on CakePHP 5, PHP and MySQL. This repository holds a standalone **Next.js + React + TypeScript** demo of only the three parts I built, running on mock data in the browser.

## My three parts

1. **Writing service and admin dashboard.** Clients request writing, editing or proofreading. The admin manages every request from one dashboard, with stats, live search and filters, status updates and payment requests.
2. **Client–admin chat.** Every request has its own conversation. The client page checks for new messages every 10 seconds, and admin replies are sent over AJAX without a page reload.
3. **Photo sales with watermarking.** A gallery of limited-edition prints. Every uploaded photo is watermarked along both diagonals before the shop shows it; the algorithm is ported from PHP GD to the Canvas API.

Not included: parts built by teammates, such as the cart and checkout, orders, coaching services, calendar booking and two-factor login.

## Mock data only

There is no database, no login and no passwords, and no real client or user data. MySQL, emails, Stripe, Cloudflare R2 and logins are mocked in the browser. All people, requests and artworks are fictional.

## Run locally

```powershell
cd demo
npm install
npm run dev
```

Then open http://localhost:3000. A 2-minute walkthrough and the full list of what is real and what is mocked are in [demo/README.md](demo/README.md).
