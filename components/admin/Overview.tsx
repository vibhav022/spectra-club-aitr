"use client";
import Link from "next/link";
import { CalendarClock, GraduationCap, Images, Users } from "lucide-react";
import { api, fmtBytes } from "@/lib/admin/api";
import { PageHead, useAuth } from "./AdminShell";
import { ErrorBox, Loading, useAdminData } from "./ui";

interface Summary { team: { total: number; visible: number }; faculty: { total: number; visible: number }; gallery: { total: number; visible: number; images: number; videos: number }; storageBytes: number; events: { total: number; showing: number; next: { title: string; date: string; time: string; visible: boolean } | null } }

export function Overview() {
  const { admin } = useAuth();
  const { data, error, loading, reload } = useAdminData(() => api<Summary>("/api/admin/summary"));
  const card = "glass block rounded-[var(--radius-card)] p-5 transition-colors hover:border-white/30";
  return (
    <>
      <PageHead title={`Welcome, ${admin.name.split(" ")[0]}`} text="A snapshot of what visitors see on the website." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : data && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <li><Link href="/admin/team/" className={card}><Users className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-4 text-3xl font-semibold tabular-nums text-ink">{data.team.total}</p><p className="text-sm text-ink-soft">Team members · {data.team.visible} visible</p></Link></li>
            <li><Link href="/admin/faculty/" className={card}><GraduationCap className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-4 text-3xl font-semibold tabular-nums text-ink">{data.faculty.total}</p><p className="text-sm text-ink-soft">Faculty profiles · {data.faculty.visible} visible</p></Link></li>
            <li><Link href="/admin/gallery/" className={card}><Images className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-4 text-3xl font-semibold tabular-nums text-ink">{data.gallery.total}</p><p className="text-sm text-ink-soft">Gallery items · {data.gallery.images} photos, {data.gallery.videos} videos</p></Link></li>
            <li><Link href="/admin/event/" className={card}><CalendarClock className="h-5 w-5 text-accent" aria-hidden="true" />
              {data.events.total ? <><p className="mt-4 truncate text-lg font-semibold text-ink">{data.events.next?.title ?? "No upcoming events"}</p><p className="text-sm text-ink-soft">{data.events.next ? `${data.events.next.date} · ${data.events.next.time} IST` : "All saved events are over."}</p><p className={`mt-1 text-xs ${data.events.showing ? "text-emerald-300" : "text-ink-soft"}`}>{data.events.showing ? `${data.events.showing} showing in the website slider` : "None showing on the website"}</p></>
                : <><p className="mt-4 text-lg font-semibold text-ink">No event set</p><p className="text-sm text-ink-soft">The announcement card is not shown.</p></>}</Link></li>
          </ul>
          <p className="mt-8 text-sm text-ink-soft">Media storage in use: {fmtBytes(data.storageBytes)}.</p>
        </>
      )}
    </>
  );
}
