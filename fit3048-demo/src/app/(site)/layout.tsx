import { SiteHeader } from "@/components/SiteHeader";
import { FlashMessages } from "@/components/Notices";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <FlashMessages />
        {children}
      </main>
    </>
  );
}
