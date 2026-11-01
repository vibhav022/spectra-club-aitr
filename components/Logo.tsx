import Image from "next/image";
import { LOGO } from "@/lib/logo";
import { site } from "@/content/site";
/** Official Spectra logo (white line-art). The wordmark is part of the image. */
export function Logo({ className = "h-9 sm:h-10" }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className={`w-auto ${className}`} />
      <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft xl:inline">{site.shortTag}</span>
    </span>
  );
}
