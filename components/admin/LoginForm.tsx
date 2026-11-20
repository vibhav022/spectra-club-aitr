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
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { api("/api/auth/me").then(() => router.replace("/admin/")).catch(() => {}); }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password, code: needsCode ? code : undefined } });
      router.replace("/admin/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "totp_required") {
        setNeedsCode(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Sign-in failed.");
        if (!(err instanceof ApiError && err.code === "invalid_totp")) setPassword("");
      }
      setCode("");
      setBusy(false);
    }
  };
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-bg-deep px-4">
      <div aria-hidden="true" className="aurora absolute inset-0 -z-0 opacity-70" />
      <form onSubmit={submit} noValidate className="glass relative z-10 w-full max-w-sm rounded-[var(--radius-card)] p-6 sm:p-8">
        <Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="mx-auto h-10 w-auto" priority />
        <h1 className="mt-5 text-center text-xl font-semibold text-ink">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Authorized club administrators only.</p>
        <fieldset disabled={busy} className="mt-6 space-y-4">
          <Field label="Email">{(p) => <input {...p} type="email" autoComplete="username" required value={email} onChange={(e) => { setEmail(e.target.value); setNeedsCode(false); setCode(""); }} className={inputCls} />}</Field>
          <Field label="Password">{(p) => <input {...p} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />}</Field>
          {needsCode && (
            <Field label="Authenticator code" hint="Enter the six-digit code from your authenticator app.">
              {(p) => <input {...p} autoFocus autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={inputCls} />}
            </Field>
          )}
        </fieldset>
        {error && <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-text">{error}</p>}
        <button type="submit" disabled={busy || !email || !password || (needsCode && code.length !== 6)} className="btn btn-primary mt-6 w-full">{busy ? <><Spinner className="h-4 w-4" />Signing in…</> : "Sign in"}</button>
      </form>
    </div>
  );
}
