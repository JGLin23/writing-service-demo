import type { Metadata, Viewport } from "next";
import { DemoBar } from "@/components/DemoBar";
import { NoticeProvider } from "@/components/Notices";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FIT3048 Demo", template: "%s · FIT3048 Demo" },
  description:
    "Interactive demo of my FIT3048 project parts: writing service with admin dashboard, client-admin chat, and photo sales with watermarking. Mock data only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NoticeProvider>
          <DemoBar />
          {children}
        </NoticeProvider>
      </body>
    </html>
  );
}
