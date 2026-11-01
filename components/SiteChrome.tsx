"use client";
import { usePathname } from "next/navigation";

/** The public header/footer are not shown inside the admin dashboard, which has its own layout. */
export function SiteChrome({ top, bottom, children }: { top: React.ReactNode; bottom: React.ReactNode; children: React.ReactNode }) {
  const admin = usePathname().startsWith("/admin");
  return (
    <>
      {!admin && top}
      <main id="main-content">{children}</main>
      {!admin && bottom}
    </>
  );
}
