import Link from "next/link";
/** Designed empty state for pages whose content hasn't been supplied yet. */
export function ComingSoon({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section aria-labelledby="soon-title" className="flex min-h-svh items-center">
      <div className="container-x relative py-32 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="soon-title" className="mt-4 text-[length:var(--fs-h2)] leading-[1.1]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md">{text}</p>
        <Link href="/" className="btn btn-primary mt-8">Back to home</Link>
      </div>
    </section>
  );
}
