"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock, CalendarDays, GraduationCap, House, Images, LayoutDashboard, LogOut, Menu, UserCog, Users, X } from "lucide-react";
import { LOGO } from "@/lib/logo";
import { api, ApiError } from "@/lib/admin/api";
import { Feedback, Loading, useToast } from "./ui";

export interface Admin { id: string; email: string; name: string }
const AuthCtx = createContext<{ admin: Admin; signOut: () => Promise<void> } | null>(null);
export const useAuth = () => { const c = useContext(AuthCtx); if (!c) throw new Error("useAuth outside AdminShell"); return c; };

const NAV = [
  { href: "/admin/", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/team/", label: "Team", icon: Users },
  { href: "/admin/faculty/", label: "Faculty", icon: GraduationCap },
  { href: "/admin/gallery/", label: "Gallery", icon: Images },
  { href: "/admin/event/", label: "Upcoming events", icon: CalendarClock },
  { href: "/admin/catalogue-events/", label: "Event Catalogue", icon: CalendarDays },
  { href: "/admin/account/", label: "Account", icon: UserCog },
  { href: "/", label: "Home", icon: House },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <Feedback><Gate>{children}</Gate></Feedback>;
}

function Gate({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const router = useRouter(); const toast = useToast();
  const onLogin = path.startsWith("/admin/login");
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined);
  const [netError, setNetError] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<{ admin: Admin }>("/api/auth/me").then((r) => { setAdmin(r.admin); setNetError(false); })
      .catch((e: ApiError) => { if (e.status === 401) setAdmin(null); else setNetError(true); });
  }, [path]);
  useEffect(() => { if (admin === null && !onLogin) router.replace("/admin/login/"); }, [admin, onLogin, router]);
  // Close the mobile drawer when the route changes (state adjusted during render; the scroll-lock effect below restores overflow when `open` turns false).
  const [openPath, setOpenPath] = useState(path);
  if (openPath !== path) { setOpenPath(path); setOpen(false); }
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  const signOut = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* cookie may already be invalid */ }
    setAdmin(null); router.replace("/admin/login/"); toast("ok", "You have been signed out.");
  };

  if (onLogin) return <AuthCtxFree>{children}</AuthCtxFree>;
  if (netError && admin === undefined) return <div className="grid min-h-svh place-items-center p-6 text-center"><div><p className="text-lg font-semibold text-ink">Can&apos;t reach the admin server</p><p className="mt-2 text-sm text-ink-soft">Check your connection and that the API URL is configured, then reload.</p><button className="btn btn-primary mt-6" onClick={() => location.reload()}>Reload</button></div></div>;
  if (!admin) return <div className="grid min-h-svh place-items-center"><Loading label="Checking your session…" /></div>;

  return (
    <AuthCtx.Provider value={{ admin, signOut }}>
      <div className="min-h-svh overflow-x-hidden bg-bg-base lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col justify-between overflow-y-auto border-r border-white/10 bg-[#090F11] p-5 lg:flex">
          <div><Link href="/admin/" aria-label="Spectra admin home" className="mb-6 flex items-center gap-3"><Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="h-8 w-auto" /><span className="text-xs uppercase tracking-[0.18em] text-accent-gold">Admin</span></Link><Nav path={path} /></div>
          <UserBox admin={admin} signOut={signOut} />
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-white/10 bg-[#090F11]/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
            <Link href="/admin/" className="flex items-center gap-2"><Image src={LOGO.navSrc} alt="Spectra" width={LOGO.navWidth} height={LOGO.navHeight} className="h-7 w-auto" /><span className="text-xs uppercase tracking-[0.18em] text-accent-gold">Admin</span></Link>
            <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15"><Menu className="h-5 w-5" aria-hidden="true" /></button>
          </header>
          {open && (
            <div className="fixed inset-0 z-[70] overflow-hidden lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
              <button type="button" aria-label="Close menu" className="absolute inset-0 bg-bg-deep/80" onClick={() => setOpen(false)} />
              <div className="absolute inset-y-0 left-0 flex h-dvh w-72 max-w-[88vw] flex-col justify-between overflow-y-auto overscroll-contain bg-[#090F11] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div><div className="mb-6 flex items-center justify-between"><span className="text-xs uppercase tracking-[0.18em] text-accent-gold">Spectra admin</span><button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15"><X className="h-5 w-5" aria-hidden="true" /></button></div><Nav path={path} onNav={() => setOpen(false)} /></div>
                <UserBox admin={admin} signOut={signOut} />
              </div>
            </div>
          )}
          <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-5 sm:px-8 sm:py-8 lg:py-10">{children}</main>
        </div>
      </div>
    </AuthCtx.Provider>
  );
}
function Nav({ path, onNav }: { path: string; onNav?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : href === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(href.slice(0, -1));
        return <Link key={href} href={href} onClick={onNav} aria-current={active ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${active ? "bg-white/10 text-ink" : "text-ink-soft hover:bg-white/5 hover:text-ink"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>;
      })}
    </nav>
  );
}
function UserBox({ admin, signOut }: { admin: Admin; signOut: () => void }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-sm font-medium text-ink">{admin.name}</p><p className="truncate text-xs text-ink-soft">{admin.email}</p>
      <button type="button" onClick={signOut} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-sm text-ink hover:bg-white/10"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out</button>
    </div>
  );
}
const AuthCtxFree = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export function PageHead({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><h1 className="text-[length:var(--fs-h2)] font-semibold leading-tight tracking-tight text-ink">{title}</h1>{text && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{text}</p>}</div>
      {children}
    </div>
  );
}
