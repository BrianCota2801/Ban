import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      {s.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-xs font-bold tracking-wide text-white">
          {s.announcementHref ? (
            <Link href={s.announcementHref} className="hover:underline">
              {s.announcement}
            </Link>
          ) : (
            s.announcement
          )}
        </div>
      )}
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
