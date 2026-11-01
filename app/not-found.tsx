import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LOGO } from "@/lib/logo";

export const metadata: Metadata = { title: "Page not found — Spectra" };
export default function NotFound() {
  return (
    <section aria-labelledby="nf-title" className="flex min-h-svh items-center">
      <div className="container-x relative py-32 text-center">
        <Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="mx-auto h-auto w-28" />
        <p className="eyebrow mt-6">404</p>
        <h1 id="nf-title" className="mt-4">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to the action.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/events/" className="btn btn-ghost">Explore events</Link>
        </div>
      </div>
    </section>
  );
}
