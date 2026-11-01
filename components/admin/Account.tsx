"use client";
import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/admin/api";
import { PageHead, useAuth } from "./AdminShell";
import { btnSmall, ErrorBox, Field, inputCls, Loading, Spinner, useAdminData, useConfirm, useToast } from "./ui";

interface Sess { id: string; createdAt: number; lastSeenAt: number; expiresAt: number; userAgent: string; ip: string; current: boolean }
const when = (s: number) => new Date(s * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export function Account() {
  const { admin, signOut } = useAuth(); const toast = useToast(); const confirm = useConfirm();
  const { data, error, loading, reload } = useAdminData(() => api<{ sessions: Sess[] }>("/api/auth/sessions").then((r) => r.sessions));
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false); const [errs, setErrs] = useState<Record<string, string>>({});

  const change = async (e: React.FormEvent) => {
    e.preventDefault(); setErrs({});
    if (next !== again) return setErrs({ again: "Passwords do not match." });
    setBusy(true);
    try { await api("/api/auth/password", { method: "POST", json: { currentPassword: cur, newPassword: next } }); toast("ok", "Password changed. Your other sessions were signed out."); setCur(""); setNext(""); setAgain(""); reload(); }
    catch (err) { const a = err as ApiError; setErrs({ ...a.fields, ...(Object.keys(a.fields).length ? {} : { form: a.message }) }); } finally { setBusy(false); }
  };
  const revoke = async (s: Sess) => { try { await api(`/api/auth/sessions/${s.id}`, { method: "DELETE" }); toast("ok", "Session signed out."); reload(); } catch (e) { toast("err", (e as Error).message); } };
  const revokeOthers = async () => {
    if (!(await confirm({ title: "Sign out all other devices?", confirm: "Sign them out", danger: false }))) return;
    try { await api("/api/auth/sessions/others", { method: "DELETE" }); toast("ok", "Other sessions signed out."); reload(); } catch (e) { toast("err", (e as Error).message); }
  };
  return (
    <>
      <PageHead title="Account & sessions" text={`Signed in as ${admin.name} (${admin.email}).`}><button type="button" className="btn btn-ghost" onClick={signOut}><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button></PageHead>
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={change} noValidate className="glass space-y-4 rounded-[var(--radius-card)] p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-ink">Change password</h2>
          <input type="text" name="username" autoComplete="username" value={admin.email} readOnly hidden />
          <Field label="Current password" error={errs.currentPassword}>{(p) => <input {...p} type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} />}</Field>
          <Field label="New password" error={errs.newPassword} hint="At least 12 characters.">{(p) => <input {...p} type="password" autoComplete="new-password" required minLength={12} value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />}</Field>
          <Field label="Repeat new password" error={errs.again}>{(p) => <input {...p} type="password" autoComplete="new-password" required value={again} onChange={(e) => setAgain(e.target.value)} className={inputCls} />}</Field>
          {errs.form && <p role="alert" className="text-sm text-danger-text">{errs.form}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || !cur || !next}>{busy ? <><Spinner className="h-4 w-4" />Changing…</> : "Change password"}</button>
        </form>
        <section className="glass rounded-[var(--radius-card)] p-5 sm:p-6" aria-labelledby="sess-h">
          <div className="flex items-center justify-between gap-3"><h2 id="sess-h" className="text-lg font-semibold text-ink">Active sessions</h2><button type="button" className={btnSmall} onClick={revokeOthers} disabled={!data || data.length < 2}>Sign out others</button></div>
          {error && <div className="mt-4"><ErrorBox message={error} onRetry={reload} /></div>}
          {loading && !data ? <Loading /> : (
            <ul className="mt-4 space-y-3">
              {data?.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm">
                  <div className="min-w-0"><p className="truncate text-ink">{s.userAgent || "Unknown device"}{s.current && <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200">This device</span>}</p>
                    <p className="mt-1 text-xs text-ink-soft">Signed in {when(s.createdAt)} · last active {when(s.lastSeenAt)}</p><p className="text-xs text-ink-soft">Expires {when(s.expiresAt)}</p></div>
                  {!s.current && <button type="button" className={btnSmall} onClick={() => revoke(s)} aria-label="Sign out this session"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
