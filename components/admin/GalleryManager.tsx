"use client";
/* eslint-disable @next/next/no-img-element -- admin previews load API/blob URLs that next/image cannot optimize */
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Film, Pencil, Plus, Tags, Trash2, Upload, X } from "lucide-react";
import { api, ApiError, fmtBytes, inspectFile, mediaUrl, uploadFile } from "@/lib/admin/api";
import { PageHead } from "./AdminShell";
import { btnSmall, EmptyState, ErrorBox, Field, inputCls, Loading, Modal, Spinner, Toggle, useAdminData, useConfirm, useToast } from "./ui";

interface Item { id: string; title: string; caption: string | null; categoryId: string; category: string; kind: "image" | "video"; src: string; thumb: string | null; sizeBytes: number; visible: boolean; width: number; height: number }
interface Cat { id: string; name: string }
interface Data { items: Item[]; categories: Cat[] }
interface Q { key: string; file: File; title: string; categoryId: string; preview: string; width: number; height: number; thumb: Blob | null; status: "ready" | "uploading" | "uploaded" | "error"; progress: number; error?: string; mediaId?: string; thumbMediaId?: string }

const IMG = ["image/jpeg", "image/png", "image/webp"], VID = ["video/mp4", "video/webm"];
const MAX_IMG = 10 * 1048576, MAX_VID = 100 * 1048576;   // mirrors the API defaults; the server enforces its own limits
const stem = (n: string) => n.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim().slice(0, 160) || "Untitled";

function Preview({ it, className = "" }: { it: Item; className?: string }) {
  const [bad, setBad] = useState(false);
  const box = `${className} flex items-center justify-center bg-surface text-ink-soft`;
  if (bad) return <div className={box}>Preview unavailable</div>;
  if (it.kind === "video" && !it.thumb) return <video src={`${mediaUrl(it.src)}#t=0.5`} preload="metadata" muted playsInline onError={() => setBad(true)} className={`${className} bg-black object-cover`} />;
 
  return <img src={mediaUrl(it.kind === "video" ? it.thumb : (it.thumb ?? it.src))} alt="" loading="lazy" onError={() => setBad(true)} className={`${className} object-cover`} />;
}

export function GalleryManager() {
  const toast = useToast(); const confirm = useConfirm();
  const { data, error, loading, reload, setData } = useAdminData(() => api<Data>("/api/admin/gallery"));
  const [fCat, setFCat] = useState(""); const [fKind, setFKind] = useState(""); const [fVis, setFVis] = useState("");
  const [edit, setEdit] = useState<Item | null>(null); const [cats, setCats] = useState(false); const [busy, setBusy] = useState<string | null>(null);
  const items = data?.items ?? []; const categories = data?.categories ?? [];
  const refreshGallery = async () => {
    try { setData(await api<Data>("/api/admin/gallery")); }
    catch { reload(); }
  };
  const shown = items.filter((i) => (!fCat || i.categoryId === fCat) && (!fKind || i.kind === fKind) && (!fVis || (fVis === "visible") === i.visible));
  const filtering = !!(fCat || fKind || fVis);

  const move = async (i: number, d: number) => {
    const next = [...items]; const j = i + d; if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; setData({ ...data!, items: next });
    try { await api("/api/admin/gallery/reorder", { method: "POST", json: { ids: next.map((x) => x.id) } }); } catch (e) { toast("err", (e as Error).message); reload(); }
  };
  const toggle = async (it: Item) => {
    setBusy(it.id);
    try { await api(`/api/admin/gallery/${it.id}`, { method: "PATCH", json: { visible: !it.visible } }); setData({ ...data!, items: items.map((x) => (x.id === it.id ? { ...x, visible: !it.visible } : x)) }); toast("ok", it.visible ? "Hidden from the website." : "Now visible on the website."); }
    catch (e) { toast("err", (e as Error).message); } finally { setBusy(null); }
  };
  const remove = async (it: Item) => {
    if (!(await confirm({ title: `Delete “${it.title}”?`, body: `This removes the ${it.kind} from the website and permanently deletes its file from storage.` }))) return;
    setBusy(it.id);
    try { await api(`/api/admin/gallery/${it.id}`, { method: "DELETE" }); setData({ ...data!, items: items.filter((x) => x.id !== it.id) }); toast("ok", "Deleted."); }
    catch (e) { toast("err", (e as Error).message); } finally { setBusy(null); }
  };

  return (
    <>
      <PageHead title="Gallery" text="Photos and videos shown in the public gallery. Photos open in the lightbox; videos play with controls."><button type="button" className="btn btn-ghost" onClick={() => setCats(true)}><Tags className="h-4 w-4" aria-hidden="true" />Categories</button></PageHead>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && <Uploader categories={categories} onDone={reload} />}
      <div className="mt-10 flex flex-wrap items-center gap-3" role="group" aria-label="Filter gallery items">
        <select aria-label="Filter by category" value={fCat} onChange={(e) => setFCat(e.target.value)} className={`${inputCls} w-full sm:!w-auto`}><option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Filter by type" value={fKind} onChange={(e) => setFKind(e.target.value)} className={`${inputCls} w-full sm:!w-auto`}><option value="">Photos &amp; videos</option><option value="image">Photos</option><option value="video">Videos</option></select>
        <select aria-label="Filter by visibility" value={fVis} onChange={(e) => setFVis(e.target.value)} className={`${inputCls} w-full sm:!w-auto`}><option value="">Any visibility</option><option value="visible">Visible</option><option value="hidden">Hidden</option></select>
        <span className="text-sm text-ink-soft">{shown.length} of {items.length}{filtering && items.length > 1 ? " · clear filters to reorder" : ""}</span>
      </div>
      <div className="mt-5">
        {loading && !data ? <Loading /> : !error && items.length === 0 ? <EmptyState title="The gallery is empty" text="Upload photos or videos above. Until then the public Gallery page shows “coming soon”." />
          : shown.length === 0 ? <EmptyState title="Nothing matches these filters" /> : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((it) => { const i = items.indexOf(it); return (
              <li key={it.id} className={`glass overflow-hidden rounded-[var(--radius-card)] ${it.visible ? "" : "opacity-70"}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                  <Preview it={it} className="h-full w-full" />
                  {it.kind === "video" && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-bg-deep/75 px-2.5 py-1 text-xs text-ink"><Film className="h-3.5 w-3.5" aria-hidden="true" />Video</span>}
                  {!it.visible && <span className="absolute right-2 top-2 rounded-full bg-bg-deep/75 px-2.5 py-1 text-xs text-ink">Hidden</span>}
                </div>
                <div className="p-3">
                  <p className="truncate font-medium text-ink">{it.title}</p>
                  <p className="truncate text-xs text-ink-soft">{it.category} · {fmtBytes(it.sizeBytes)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <button type="button" className={btnSmall} onClick={() => setEdit(it)} aria-label={`Edit ${it.title}`}><Pencil className="h-3.5 w-3.5" aria-hidden="true" />Edit</button>
                    <button type="button" className={btnSmall} onClick={() => toggle(it)} disabled={busy === it.id} aria-label={it.visible ? `Hide ${it.title}` : `Show ${it.title}`}>{it.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                    <button type="button" className={btnSmall} onClick={() => remove(it)} disabled={busy === it.id} aria-label={`Delete ${it.title}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                    {!filtering && <span className="ml-auto flex gap-1"><button type="button" className={btnSmall} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${it.title} earlier`}><ArrowUp className="h-4 w-4" /></button><button type="button" className={btnSmall} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Move ${it.title} later`}><ArrowDown className="h-4 w-4" /></button></span>}
                  </div>
                </div>
              </li>); })}
          </ul>)}
      </div>
      {edit && <EditItem item={edit} categories={categories} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
      {cats && <Categories categories={categories} onClose={() => setCats(false)} onChanged={refreshGallery} />}
    </>
  );
}

function Uploader({ categories, onDone }: { categories: Cat[]; onDone: () => void }) {
  const toast = useToast(); const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState<Q[]>([]); const [running, setRunning] = useState(false); const [drag, setDrag] = useState(false); const [note, setNote] = useState("");
  const patch = (key: string, p: Partial<Q>) => setQ((s) => s.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const add = async (files: FileList | File[]) => {
    const rejected: string[] = []; const fresh: Q[] = [];
    for (const f of Array.from(files)) {
      const img = IMG.includes(f.type), vid = VID.includes(f.type);
      if (!img && !vid) { rejected.push(`${f.name}: unsupported type (use JPEG, PNG, WebP, MP4 or WebM)`); continue; }
      if (f.size > (img ? MAX_IMG : MAX_VID)) { rejected.push(`${f.name}: larger than ${img ? 10 : 100} MB`); continue; }
      const meta = await inspectFile(f);
      fresh.push({ key: crypto.randomUUID(), file: f, title: stem(f.name), categoryId: categories[0]?.id ?? "", preview: meta.preview, width: meta.width, height: meta.height, thumb: meta.thumb, status: "ready", progress: 0 });
    }
    setNote(rejected.join(" · ")); setQ((s) => [...s, ...fresh]);
  };
  const drop = (key: string) => setQ((s) => { const x = s.find((i) => i.key === key); if (x) URL.revokeObjectURL(x.preview); return s.filter((i) => i.key !== key); });

  const start = async () => {
    if (!categories.length) return toast("err", "Create a category first.");
    setRunning(true); const done: Q[] = [];
    for (const it of q.filter((x) => x.status !== "uploaded")) {
      patch(it.key, { status: "uploading", progress: 0, error: undefined });
      try {
        const main = it.mediaId ? { id: it.mediaId } : await uploadFile(it.file, "gallery", { width: it.width, height: it.height }, (p) => patch(it.key, { progress: p * 0.95 }));
        let thumbId = it.thumbMediaId;
        if (!thumbId && it.thumb) { try { thumbId = (await uploadFile(new File([it.thumb], "thumb.webp", { type: "image/webp" }), "thumb", { width: Math.min(480, it.width) }, undefined)).id; } catch { /* thumbnails are optional */ } }
        const u = { ...it, mediaId: main.id, thumbMediaId: thumbId, status: "uploaded" as const, progress: 1 }; patch(it.key, u); done.push(u);
      } catch (e) { patch(it.key, { status: "error", error: e instanceof ApiError ? e.message : "Upload failed." }); }
    }
    if (done.length) {
      try {
        await api("/api/admin/gallery", { method: "POST", json: { items: done.map((d) => ({ title: d.title.trim() || "Untitled", categoryId: d.categoryId, mediaId: d.mediaId, thumbMediaId: d.thumbMediaId ?? null })) } });
        toast("ok", `${done.length} item${done.length > 1 ? "s" : ""} added to the gallery.`);
        setQ((s) => { s.filter((x) => done.some((d) => d.key === x.key)).forEach((x) => URL.revokeObjectURL(x.preview)); return s.filter((x) => !done.some((d) => d.key === x.key)); });
        onDone();
      } catch (e) { toast("err", `Files uploaded but could not be added to the gallery: ${(e as Error).message}. Press Upload again to retry.`); }
    }
    setRunning(false);
  };

  return (
    <section aria-labelledby="up-h" className="glass rounded-[var(--radius-card)] p-5 sm:p-6">
      <h2 id="up-h" className="text-lg font-semibold text-ink">Upload photos &amp; videos</h2>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); void add(e.dataTransfer.files); }}
        className={`mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-8 text-center ${drag ? "border-accent bg-accent/10" : "border-white/20"}`}>
        <Upload className="h-6 w-6 text-accent" aria-hidden="true" />
        <p className="text-sm text-ink-soft">Drag files here, or choose them. JPEG, PNG, WebP up to 10 MB · MP4, WebM up to 100 MB.</p>
        <input ref={input} id="gal-files" type="file" multiple accept={[...IMG, ...VID].join(",")} className="sr-only" onChange={(e) => { if (e.target.files) void add(e.target.files); e.target.value = ""; }} />
        <label htmlFor="gal-files" className="btn btn-ghost cursor-pointer"><Plus className="h-4 w-4" aria-hidden="true" />Choose files</label>
      </div>
      {note && <p role="alert" className="mt-3 text-sm text-danger-text">{note}</p>}
      {q.length > 0 && (
        <>
          <ul className="mt-5 space-y-3">
            {q.map((x) => (
              <li key={x.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 p-3 sm:flex-nowrap">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">{x.file.type.startsWith("image/") ? <img src={x.preview} alt="" className="h-full w-full object-cover" /> : x.thumb ? <video src={x.preview} muted className="h-full w-full object-cover" /> : <Film className="m-auto mt-5 h-6 w-6 text-ink-soft" aria-hidden="true" />}</div>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_11rem]">
                  <input aria-label={`Title for ${x.file.name}`} value={x.title} maxLength={160} disabled={x.status === "uploading"} onChange={(e) => patch(x.key, { title: e.target.value })} className={inputCls} />
                  <select aria-label={`Category for ${x.file.name}`} value={x.categoryId} disabled={x.status === "uploading"} onChange={(e) => patch(x.key, { categoryId: e.target.value })} className={inputCls}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <div className="sm:col-span-2">
                    <p className="truncate text-xs text-ink-soft">{x.file.name} · {fmtBytes(x.file.size)}{x.status === "uploaded" && " · uploaded"}</p>
                    {(x.status === "uploading" || x.status === "uploaded") && <div role="progressbar" aria-label={`Upload progress for ${x.file.name}`} aria-valuenow={Math.round(x.progress * 100)} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(x.progress * 100)}%` }} /></div>}
                    {x.error && <p role="alert" className="mt-1 text-xs text-danger-text">{x.error}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => drop(x.key)} disabled={x.status === "uploading"} aria-label={`Remove ${x.file.name} from the queue`} className={btnSmall}><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end"><button type="button" className="btn btn-primary" onClick={start} disabled={running}>{running ? <><Spinner className="h-4 w-4" />Uploading…</> : `Upload ${q.filter((x) => x.status !== "uploaded").length} file${q.length > 1 ? "s" : ""}`}</button></div>
        </>
      )}
    </section>
  );
}

function EditItem({ item, categories, onClose, onSaved }: { item: Item; categories: Cat[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ title: item.title, caption: item.caption ?? "", categoryId: item.categoryId, visible: item.visible });
  const [file, setFile] = useState<File | null>(null); const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false); const [errs, setErrs] = useState<Record<string, string>>({}); const [formErr, setFormErr] = useState("");
  const pick = (f?: File) => {
    if (!f) return setFile(null); setFormErr("");
    const img = IMG.includes(f.type), vid = VID.includes(f.type);
    if (!img && !vid) return setFormErr("Unsupported file type."); if (f.size > (img ? MAX_IMG : MAX_VID)) return setFormErr(`File is larger than ${img ? 10 : 100} MB.`);
    setFile(f);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErrs({}); setFormErr("");
    try {
      const body: Record<string, unknown> = { ...v, caption: v.caption.trim() || null };
      if (file) {
        const meta = await inspectFile(file); setProgress(0);
        const m = await uploadFile(file, "gallery", { width: meta.width, height: meta.height }, setProgress); body.mediaId = m.id;
        if (meta.thumb) { try { body.thumbMediaId = (await uploadFile(new File([meta.thumb], "thumb.webp", { type: "image/webp" }), "thumb", { width: Math.min(480, meta.width) })).id; } catch { /* optional */ } }
        URL.revokeObjectURL(meta.preview);
      }
      await api(`/api/admin/gallery/${item.id}`, { method: "PATCH", json: body }); toast("ok", "Saved."); onSaved();
    } catch (err) { const a = err as ApiError; setErrs(a.fields ?? {}); setFormErr(a.message); setBusy(false); setProgress(null); }
  };
  return (
    <Modal title="Edit gallery item" onClose={onClose}>
      <form onSubmit={save} noValidate className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          {item.kind === "video" ? <video src={mediaUrl(item.src)} poster={mediaUrl(item.thumb)} controls preload="metadata" playsInline className="max-h-64 w-full" /> : <img src={mediaUrl(item.src)} alt={item.title} className="max-h-64 w-full object-contain" />}
        </div>
        <Field label="Title" error={errs.title}>{(p) => <input {...p} value={v.title} maxLength={160} required onChange={(e) => setV({ ...v, title: e.target.value })} className={inputCls} />}</Field>
        <Field label="Caption (optional)" error={errs.caption}>{(p) => <textarea {...p} rows={3} maxLength={600} value={v.caption} onChange={(e) => setV({ ...v, caption: e.target.value })} className={inputCls} />}</Field>
        <Field label="Category" error={errs.categoryId}>{(p) => <select {...p} value={v.categoryId} onChange={(e) => setV({ ...v, categoryId: e.target.value })} className={inputCls}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}</Field>
        <Field label="Replace file (optional)" hint="The old file is deleted from storage once the new one is saved.">{(p) => <input {...p} type="file" accept={[...IMG, ...VID].join(",")} onChange={(e) => pick(e.target.files?.[0])} className={`${inputCls} file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-ink`} />}</Field>
        {progress !== null && <div role="progressbar" aria-label="Upload progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} /></div>}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3"><span className="text-sm text-ink">Show on the public website</span><Toggle checked={v.visible} onChange={(x) => setV({ ...v, visible: x })} label="Visible on website" /></div>
        {formErr && <p role="alert" className="text-sm text-danger-text">{formErr}</p>}
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" />Saving…</> : "Save"}</button></div>
      </form>
    </Modal>
  );
}

function Categories({ categories, onClose, onChanged }: { categories: Cat[]; onClose: () => void; onChanged: () => void | Promise<void> }) {
  const toast = useToast(); const confirm = useConfirm();
  const [name, setName] = useState(""); const [names, setNames] = useState<Record<string, string>>({}); const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(""); try { await fn(); await onChanged(); toast("ok", ok); } catch (e) { setErr((e as Error).message); } };
  return (
    <Modal title="Gallery categories" onClose={onClose}>
      <p className="mb-4 text-sm text-ink-soft">These become the filter buttons on the public gallery. The Recap category is included automatically and is reserved for recap photos and videos. A category that still has items cannot be deleted.</p>
      <ul className="space-y-3">
        {categories.map((c) => {
          const reserved = c.name.trim().toLocaleLowerCase() === "recap";
          return (
            <li key={c.id} className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center">
              <input aria-label={`Name of category ${c.name}`} value={names[c.id] ?? c.name} maxLength={40} disabled={reserved} onChange={(e) => setNames({ ...names, [c.id]: e.target.value })} className={`${inputCls} min-w-0 flex-1`} />
              <div className="flex shrink-0 gap-2">
                <button type="button" className={`${btnSmall} flex-1 sm:flex-none`} disabled={reserved || (names[c.id] ?? c.name) === c.name} onClick={() => run(async () => { await api(`/api/admin/categories/${c.id}`, { method: "PATCH", json: { name: names[c.id] } }); setNames((current) => { const next = { ...current }; delete next[c.id]; return next; }); }, "Renamed.")}>{reserved ? "Default" : "Rename"}</button>
                <button type="button" className={btnSmall} disabled={reserved} aria-label={`Delete category ${c.name}`} onClick={async () => { if (await confirm({ title: `Delete category “${c.name}”?` })) await run(() => api(`/api/admin/categories/${c.id}`, { method: "DELETE" }), "Category deleted."); }}><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          );
        })}
      </ul>
      <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void run(() => api("/api/admin/categories", { method: "POST", json: { name } }).then(() => setName("")), "Category added."); }}>
        <input aria-label="New category name" placeholder="New category" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} className={`${inputCls} min-w-0 flex-1`} /><button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={!name.trim()}>Add</button>
      </form>
      {err && <p role="alert" className="mt-3 text-sm text-danger-text">{err}</p>}
    </Modal>
  );
}
