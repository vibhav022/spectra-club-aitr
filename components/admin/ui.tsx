"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

export const inputCls = "block w-full min-h-11 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-ink placeholder:text-ink-soft/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60";
export const btnDanger = "btn border border-danger/50 bg-danger/10 text-danger-text hover:bg-danger/20";
export const btnSmall = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 text-sm text-ink hover:border-white/35 hover:bg-white/10 disabled:opacity-50";

export const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => <Loader2 className={`${className} animate-spin`} aria-hidden="true" />;
export function Loading({ label = "Loading…" }: { label?: string }) { return <div role="status" className="flex items-center gap-3 py-16 text-ink-soft"><Spinner />{label}</div>; }
export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return <div className="rounded-[var(--radius-card)] border border-dashed border-white/15 px-6 py-14 text-center"><p className="text-lg font-semibold text-ink">{title}</p>{text && <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{text}</p>}<div className="mt-5 flex justify-center">{children}</div></div>;
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger-text"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1">{message}</span>{onRetry && <button type="button" onClick={onRetry} className={btnSmall}>Retry</button>}</div>;
}
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode }) {
  const id = useId(); const d = error || hint ? `${id}-d` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": d })}
      {(error || hint) && <p id={d} className={`mt-1.5 text-xs ${error ? "text-danger-text" : "text-ink-soft"}`}>{error ?? hint}</p>}
    </div>
  );
}
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 ${checked ? "border-accent bg-accent/40" : "border-white/20 bg-white/10"}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/* ---------- Toasts ---------- */
type Toast = { id: number; kind: "ok" | "err"; text: string };
const ToastCtx = createContext<(kind: "ok" | "err", text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
/* ---------- Confirm dialog ---------- */
type ConfirmOpts = { title: string; body?: string; confirm?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function Feedback({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const push = useCallback((kind: "ok" | "err", text: string) => {
    const id = Date.now() + Math.random(); setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "err" ? 8000 : 4000);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDlg({ ...o, resolve })), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  return (
    <ToastCtx.Provider value={push}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-3 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end">
          {toasts.map((t) => (
            <div key={t.id} role={t.kind === "err" ? "alert" : "status"} className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${t.kind === "ok" ? "border-emerald-400/30 bg-[#0f1f1a]/95 text-emerald-100" : "border-danger/40 bg-[#2a1210]/95 text-danger-text"}`}>
              {t.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}{t.text}
            </div>
          ))}
        </div>
        {dlg && (
          <Modal title={dlg.title} onClose={() => close(false)} small>
            {dlg.body && <p className="text-sm text-ink-soft">{dlg.body}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button type="button" className={dlg.danger === false ? "btn btn-primary" : btnDanger} onClick={() => close(true)} autoFocus>{dlg.confirm ?? "Delete"}</button>
            </div>
          </Modal>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

export function Modal({ title, onClose, children, small, wide }: { title: string; onClose: () => void; children: React.ReactNode; small?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const tid = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const f = Array.from(ref.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])") ?? []);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    if (!ref.current?.contains(document.activeElement)) ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-bg-deep/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={tid}
        className={`flex max-h-[92svh] w-full flex-col rounded-t-3xl border border-white/12 bg-[#0A1012] shadow-2xl sm:rounded-3xl ${small ? "sm:max-w-md" : wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 id={tid} className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-white/10 hover:text-ink"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

/** Load JSON from the admin API with loading/error/reload handling. */
export function useAdminData<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const loaderRef = useRef(loader);
  useEffect(() => { loaderRef.current = loader; });
  const run = useCallback(() => loaderRef.current().then((data) => setState({ data, loading: false })).catch((e: Error) => setState((s) => ({ ...s, loading: false, error: e.message }))), []);
  useEffect(() => { void run(); }, [run]);
  const reload = useCallback(() => { setState((s) => ({ ...s, loading: true, error: undefined })); void run(); }, [run]);
  return { ...state, reload, setData: (d: T) => setState({ data: d, loading: false }) };
}
