"use client";
import { useState } from "react";
import { ArrowUpRight, CalendarClock, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { events } from "@/content/events";
import { api, ApiError } from "@/lib/admin/api";
import { PageHead } from "./AdminShell";
import { btnSmall, EmptyState, ErrorBox, Field, inputCls, Loading, Modal, Spinner, Toggle, useAdminData, useConfirm, useToast } from "./ui";

interface Ev { id: string; title: string; eventSlug: string | null; date: string; time: string; venue: string | null; registrationUrl: string | null; ctaText: string; visible: boolean; startsAt: string }
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MAX_EVENTS = 12;
const blank = { title: "", eventSlug: "", date: "", time: "10:00", venue: "", registrationUrl: "", ctaText: "Participate now", visible: true };
type Form = typeof blank;
const toForm = (e: Ev): Form => ({ title: e.title, eventSlug: e.eventSlug ?? "", date: e.date, time: e.time, venue: e.venue ?? "", registrationUrl: e.registrationUrl ?? "", ctaText: e.ctaText, visible: e.visible });
const clock = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const longDate = (d: string) => { const [y, m, day] = d.split("-").map(Number); return `${day} ${MONTHS[m - 1]} ${y}`; };
const isOver = (e: Ev) => Date.now() - new Date(e.startsAt).getTime() > 864e5;   // the website hides an event 24 h after it starts

export function EventManager() {
  const toast = useToast(); const confirm = useConfirm();
  const { data, error, loading, reload, setData } = useAdminData(() => api<{ items: Ev[] }>("/api/admin/events").then((r) => r.items));
  const [edit, setEdit] = useState<Ev | "new" | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const items = data ?? [];
  const full = items.length >= MAX_EVENTS;

  const setVisible = async (e: Ev, v: boolean) => {
    setBusy(e.id);
    try { await api(`/api/admin/events/${e.id}`, { method: "PATCH", json: { visible: v } }); setData(items.map((x) => (x.id === e.id ? { ...x, visible: v } : x))); toast("ok", v ? "Now showing on the website." : "Hidden from the website."); }
    catch (err) { toast("err", (err as Error).message); } finally { setBusy(null); }
  };
  const remove = async (e: Ev) => {
    if (!(await confirm({ title: `Delete “${e.title}”?`, body: "It disappears from the website slider straight away. This cannot be undone. To keep the details, use Hide instead." }))) return;
    setBusy(e.id);
    try { await api(`/api/admin/events/${e.id}`, { method: "DELETE" }); setData(items.filter((x) => x.id !== e.id)); toast("ok", "Event deleted."); }
    catch (err) { toast("err", (err as Error).message); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHead title="Upcoming events" text="Every visible event becomes one card in the home-page slider, soonest first. All times are Asia/Kolkata (IST). A card hides itself 24 hours after the event starts.">
        <button type="button" className="btn btn-primary" onClick={() => setEdit("new")} disabled={full} title={full ? `Up to ${MAX_EVENTS} events` : undefined}><Plus className="h-4 w-4" aria-hidden="true" />Add event</button>
      </PageHead>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : !error && items.length === 0 ? (
        <EmptyState title="No upcoming events" text="Add an event and it appears in the countdown card on the home page. The card is hidden while there are none."><button type="button" className="btn btn-primary" onClick={() => setEdit("new")}>Add event</button></EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft">{items.filter((e) => e.visible && !isOver(e)).length} showing on the website · the slider shows the 5 soonest.</p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {items.map((e) => {
              const over = isOver(e); const [, m, d] = e.date.split("-").map(Number);
              return (
                <li key={e.id} className={`glass flex items-start gap-4 rounded-[var(--radius-card)] p-4 ${e.visible && !over ? "" : "opacity-70"}`}>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center leading-none"><span className="block text-xl font-semibold tabular-nums text-ink">{d}</span><span className="mt-1 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-accent-gold">{MONTHS[m - 1]}</span></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{e.title}</p>
                    <p className="truncate text-sm text-ink-soft">{longDate(e.date)} · {clock(e.time)} IST{e.venue ? ` · ${e.venue}` : ""}</p>
                    <p className={`mt-1 text-xs ${e.visible && !over ? "text-emerald-300" : "text-ink-soft"}`}>{over ? "Over: no longer shown" : e.visible ? "Showing on the website" : "Hidden from the website"}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <button type="button" className={btnSmall} onClick={() => setEdit(e)} aria-label={`Edit ${e.title}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                      <button type="button" className={btnSmall} onClick={() => setVisible(e, !e.visible)} disabled={busy === e.id} aria-label={e.visible ? `Hide ${e.title}` : `Show ${e.title}`}>{e.visible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}{e.visible ? "Visible" : "Hidden"}</button>
                      <button type="button" className={btnSmall} onClick={() => remove(e)} disabled={busy === e.id} aria-label={`Delete ${e.title}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" />Delete</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {edit && <EventModal event={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </>
  );
}

function EventModal({ event, onClose, onSaved }: { event: Ev | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<Form>(event ? toForm(event) : blank);
  const [busy, setBusy] = useState(false); const [errs, setErrs] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState("");
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [y, m, d] = f.date ? f.date.split("-").map(Number) : [0, 0, 0];

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault(); setBusy(true); setErrs({}); setFormErr("");
    try {
      await api(event ? `/api/admin/events/${event.id}` : "/api/admin/events", { method: event ? "PATCH" : "POST", json: { ...f, eventSlug: f.eventSlug || null } });
      toast("ok", event ? "Event saved. The website updates on the next refresh." : "Event added. It shows in the website slider on the next refresh."); onSaved();
    } catch (e) { const a = e as ApiError; setErrs(a.fields ?? {}); setFormErr(a.message); toast("err", a.message); } finally { setBusy(false); }
  };

  return (
    <Modal title={event ? "Edit event" : "Add event"} onClose={onClose} wide>
      <div className="grid gap-6 md:grid-cols-[1fr_17rem]">
        <form onSubmit={save} noValidate className="space-y-4">
          <Field label="Event name" error={errs.title}>{(p) => <input {...p} value={f.title} onChange={set("title")} required maxLength={120} className={inputCls} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date (IST)" error={errs.date}>{(p) => <input {...p} type="date" value={f.date} onChange={set("date")} required className={inputCls} />}</Field>
            <Field label="Start time (IST)" error={errs.time}>{(p) => <input {...p} type="time" value={f.time} onChange={set("time")} required className={inputCls} />}</Field>
          </div>
          <Field label="Venue / location" error={errs.venue}>{(p) => <input {...p} value={f.venue} onChange={set("venue")} maxLength={160} placeholder="AITR Campus, Indore" className={inputCls} />}</Field>
          <Field label="Registration link" error={errs.registrationUrl} hint="Leave empty to use the event's Instagram page, or the club's.">{(p) => <input {...p} type="url" inputMode="url" value={f.registrationUrl} onChange={set("registrationUrl")} placeholder="https://…" className={inputCls} />}</Field>
          <Field label="Button text" error={errs.ctaText}>{(p) => <input {...p} value={f.ctaText} onChange={set("ctaText")} maxLength={40} className={inputCls} />}</Field>
          <Field label="Link title to an event page (optional)" error={errs.eventSlug} hint="Makes the event name open that page on the site.">{(p) => <select {...p} value={f.eventSlug} onChange={set("eventSlug")} className={inputCls}><option value="">No link</option>{events.map((e) => <option key={e.slug} value={e.slug}>{e.title}</option>)}</select>}</Field>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3"><span className="text-sm text-ink">Show on the website</span><Toggle checked={f.visible} onChange={(v) => setF((s) => ({ ...s, visible: v }))} label="Show on the website" /></div>
          {formErr && <p role="alert" className="text-sm text-danger-text">{formErr}</p>}
          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" />Saving…</> : event ? "Save changes" : "Add event"}</button>
          </div>
        </form>
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink"><CalendarClock className="h-4 w-4 text-accent" aria-hidden="true" />Preview</p>
          <aside aria-label="Event card preview" className={`relative overflow-hidden rounded-3xl border border-white/12 bg-[#0C1214]/85 p-4 ${f.visible ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-accent-gold"><span aria-hidden="true" className="badge-dot" />Upcoming event</p>
                <p className="mt-2 truncate text-lg font-semibold text-ink">{f.title || "Event name"}</p>
                <p className="mt-0.5 truncate text-sm text-ink-soft">{f.time ? clock(f.time) : "--"}{f.venue ? ` · ${f.venue}` : ""}</p></div>
              <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center leading-none"><span className="block text-xl font-semibold text-ink">{d || "--"}</span><span className="mt-1 block text-[0.62rem] font-medium uppercase tracking-[0.16em] text-accent-gold">{m ? MONTHS[m - 1] : "---"}</span></div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-1.5">{["Days", "Hours", "Mins", "Secs"].map((l) => <div key={l} className="rounded-xl border border-white/10 bg-white/[0.045] py-2 text-center"><div className="text-lg font-semibold text-ink">--</div><div className="mt-1 text-[0.55rem] uppercase tracking-[0.12em] text-accent-gold">{l}</div></div>)}</div>
            <div className="btn btn-primary mt-3 w-full">{f.ctaText || "Participate now"} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></div>
          </aside>
          <p className="mt-3 text-xs text-ink-soft">{y ? `Starts ${d} ${MONTHS[m - 1]} ${y}, ${clock(f.time)} IST. ` : ""}{f.visible ? "Visible once saved." : "Hidden: visitors will not see it."}</p>
        </div>
      </div>
    </Modal>
  );
}
