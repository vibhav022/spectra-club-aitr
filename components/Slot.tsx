import Image from "next/image";
import { LOGO } from "@/lib/logo";
/** Placeholder fill: the Spectra logo, faint. Used inside Poster and gallery tiles. */
export function Slot() {
  return <Image src={LOGO.navSrc} alt="" aria-hidden="true" width={LOGO.navWidth} height={LOGO.navHeight} className="h-auto w-[45%] max-w-[16rem] select-none opacity-[0.16]" />;
}
