"use client";
/* eslint-disable @next/next/no-img-element -- admin previews load API/blob URLs that next/image cannot optimize */
import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, User } from "lucide-react";
import { api, ApiError, mediaUrl } from "@/lib/admin/api";
import { PageHead } from "./AdminShell";
import { PhotoField } from "./PhotoField";
import { btnSmall, EmptyState, ErrorBox, Field, inputCls, Loading, Modal, Spinner, Toggle, useAdminData, useConfirm, useToast } from "./ui";

interface Person { id: string; name: string; visible: boolean; photoUrl: string | null; photoMediaId: string | null; [k: string]: unknown }
type Kind = "team" | "faculty";
const CFG = {
  team: { path: "/api/admin/team", title: "Team", noun: "team member", text: "People shown in the public Team page. Leadership appear as large cards, core members as a grid.",
    sub: (p: Person) => String(p.role), fields: [{ k: "name", label: "Name" }, { k: "role", label: "Role / designation", hint: 'e.g. "Chairperson" or "Core Member"' }] },
  faculty: { path: "/api/admin/faculty", title: "Faculty", noun: "faculty profile", text: "Faculty shown on the home page and the Team page.",
    sub: (p: Person) => [p.designation, p.department].filter(Boolean).join(" · "), fields: [{ k: "name", label: "Name" }, { k: "designation", label: "Designation", hint: 'e.g. "Faculty Coordinator"' }, { k: "department", label: "Department (optional)", optional: true }] },
} as const;

export function PeopleManager({ kind }: { kind: Kind }) {
  const cfg = CFG[kind]; const toast = useToast(); const confirm = useConfirm();
  const { data, error, loading, reload, setData } = useAdminData(() => api<{ items: Person[] }>(cfg.path).then((r) => r.items));
  const [edit, setEdit] = useState<Person | "new" | null>(null); const [busy, setBusy] = useState<string | null>(null);
  const items = data ?? [];

  const move = async (i: number, d: number) => {
    const next = [...items]; const j = i + d; if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; setData(next);
    try { await api(`${cfg.path}/reorder`, { method: "POST", json: { ids: next.map((x) => x.id) } }); }
    catch (e) { toast("err", (e as Error).message); reload(); }
  };
  const setVisible = async (p: Person, v: boolean) => {
    setBusy(p.id);
    try { await api(`${cfg.path}/${p.id}`, { method: "PATCH", json: { visible: v } }); setData(items.map((x) => (x.id === p.id ? { ...x, visible: v } : x))); toast("ok", v ? "Now visible on the website." : "Hidden from the website."); }
    catch (e) { toast("err", (e as Error).message); } finally { setBusy(null); }
  };
  const remove = async (p: Person) => {
    if (!(await confirm({ title: `Delete ${p.name}?`, body: `This removes the ${cfg.noun} from the website and permanently deletes their photo. It cannot be undone.` }))) return;
    setBusy(p.id);
    try { await api(`${cfg.path}/${p.id}`, { method: "DELETE" }); setData(items.filter((x) => x.id !== p.id)); toast("ok", "Deleted."); }
    catch (e) { toast("err", (e as Error).message); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHead title={cfg.title} text={cfg.text}><button type="button" className="btn btn-primary" onClick={() => setEdit("new")}><Plus className="h-4 w-4" aria-hidden="true" />Add {cfg.noun}</button></PageHead>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : !error && items.length === 0 ? (
        <EmptyState title={`No ${cfg.title.toLowerCase()} yet`} text={`Add the first ${cfg.noun}. The public page stays empty until you do.`}><button type="button" className="btn btn-primary" onClick={() => setEdit("new")}>Add {cfg.noun}</button></EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((p, i) => (
            <li key={p.id} className={`glass flex items-center gap-4 rounded-[var(--radius-card)] p-3 ${p.visible ? "" : "opacity-70"}`}>
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface">
                {p.photoUrl ? <img src={mediaUrl(p.photoUrl)} alt="" className="h-full w-full object-cover" /> : <User className="h-7 w-7 text-white/25" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{p.name}</p>
                <p className="truncate text-sm text-ink-soft">{cfg.sub(p)}{kind === "team" && ` · ${p.tier}`}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button type="button" className={btnSmall} onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                  <button type="button" className={btnSmall} onClick={() => setVisible(p, !p.visible)} disabled={busy === p.id} aria-label={p.visible ? `Hide ${p.name}` : `Show ${p.name}`}>{p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{p.visible ? "Visible" : "Hidden"}</button>
                  <button type="button" className={btnSmall} onClick={() => remove(p)} disabled={busy === p.id} aria-label={`Delete ${p.name}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" className={btnSmall} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.name} up`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className={btnSmall} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${p.name} down`}><ArrowDown className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {edit && <PersonForm kind={kind} person={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </>
  );
}

function PersonForm({ kind, person, onClose, onSaved }: { kind: Kind; person: Person | null; onClose: () => void; onSaved: () => void }) {
  const cfg = CFG[kind]; const toast = useToast();
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries([...cfg.fields.map((f) => f.k), ...(kind === "team" ? ["tier", "instagram", "linkedin", "bio", "specialization", "contributions"] : [])].map((k) => [k, String(person?.[k] ?? (k === "tier" ? "core" : ""))])));
  const [photo, setPhoto] = useState<{ id: string | null; url: string | null }>({ id: person?.photoMediaId ?? null, url: person?.photoUrl ? (mediaUrl(person.photoUrl) ?? null) : null });
  const [visible, setVisible] = useState(person?.visible ?? true);
  const [busy, setBusy] = useState(false); const [errs, setErrs] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs({}); setFormErr("");
    const body: Record<string, unknown> = { ...v, visible, photoMediaId: photo.id };
    try {
      if (person) await api(`${cfg.path}/${person.id}`, { method: "PATCH", json: body }); else await api(cfg.path, { method: "POST", json: body });
      toast("ok", person ? "Saved." : `Added ${v.name}.`); onSaved();
    } catch (err) { const a = err as ApiError; setErrs(a.fields ?? {}); setFormErr(a.message); setBusy(false); }
  };
  return (
    <Modal title={person ? `Edit ${person.name}` : `Add ${cfg.noun}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4" noValidate>
        <PhotoField url={photo.url} onChange={setPhoto} />
        {cfg.fields.map((f) => <Field key={f.k} label={f.label} error={errs[f.k]} hint={"hint" in f ? f.hint : undefined}>{(p) => <input {...p} value={v[f.k]} onChange={set(f.k)} className={inputCls} required={!("optional" in f)} maxLength={120} />}</Field>)}
        {kind === "team" && <>
                    <Field label="LinkedIn link (optional)" error={errs.linkedin}>{(p) => <input {...p} type="url" inputMode="url" placeholder="https://linkedin.com/in/…" value={v.linkedin} onChange={set("linkedin")} className={inputCls} />}</Field>
          <Field label="Short introduction (optional)" error={errs.bio} hint="One or two sentences. Shown when a visitor opens the profile.">{(p) => <textarea {...p} rows={3} maxLength={400} value={v.bio} onChange={set("bio")} className={inputCls} />}</Field>
          <Field label="Specialization / interests (optional)" error={errs.specialization} hint='e.g. "Web development, UI design"'>{(p) => <input {...p} maxLength={200} value={v.specialization} onChange={set("specialization")} className={inputCls} />}</Field>
          <Field label="Contributions to Spectra (optional)" error={errs.contributions} hint="Leave any optional field empty and it is simply not shown.">{(p) => <textarea {...p} rows={3} maxLength={400} value={v.contributions} onChange={set("contributions")} className={inputCls} />}</Field>
        </>}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3"><span className="text-sm text-ink">Show on the public website</span><Toggle checked={visible} onChange={setVisible} label="Visible on website" /></div>
        {formErr && <p role="alert" className="text-sm text-danger-text">{formErr}</p>}
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" />Saving…</> : "Save"}</button></div>
      </form>
    </Modal>
  );
}
