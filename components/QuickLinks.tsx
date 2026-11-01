"use client";
import Link from "next/link";
import { useLiveLinks } from "@/lib/useLiveLinks";
import type { NavLink } from "@/lib/nav";
export function QuickLinks({ links, className, linkClassName }: { links: NavLink[]; className?: string; linkClassName?: string }) {
  const shown = useLiveLinks(links);
  return <ul className={className}>{shown.map((l) => <li key={l.href}><Link href={l.href} className={linkClassName}>{l.label}</Link></li>)}</ul>;
}
