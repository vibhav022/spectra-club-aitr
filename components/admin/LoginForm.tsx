"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LOGO } from "@/lib/logo";
import { api, ApiError } from "@/lib/admin/api";
import { Field, inputCls, Spinner } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { api("/api/auth/me").then(() => router.replace("/admin/")).catch(() => {}); }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await api("/api/auth/login", { method: "POST", json: { email, password } }); router.replace("/admin/"); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Sign-in failed."); setBusy(false); setPassword(""); }
  };
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-bg-deep px-4">
      <div aria-hidden="true" className="aurora absolute inset-0 -z-0 opacity-70" />
      <form onSubmit={submit} noValidate className="glass relative z-10 w-full max-w-sm rounded-[var(--radius-card)] p-6 sm:p-8">
        <Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="mx-auto h-10 w-auto" priority />
        <h1 className="mt-5 text-center text-xl font-semibold text-ink">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Authorized club administrators only.</p>
        <div className="mt-6 space-y-4">
          <Field label="Email">{(p) => <input {...p} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />}</Field>
          <Field label="Password">{(p) => <input {...p} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />}</Field>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-text">{error}</p>}
        <button type="submit" disabled={busy || !email || !password} className="btn btn-primary mt-6 w-full">{busy ? <><Spinner className="h-4 w-4" />Signing in…</> : "Sign in"}</button>
      </form>
    </div>
  );
}
