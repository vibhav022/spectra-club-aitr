/**
 * Unlike layout.tsx, a template remounts on every navigation, so this wrapper's CSS fade (.page-fade in globals.css)
 * replays each time you move between pages. It is a server component on purpose: pure CSS, no JS needed, and the
 * content is never hidden waiting for hydration.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
