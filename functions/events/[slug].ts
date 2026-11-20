
interface EventContext {
  request: Request;
  params: {
    slug: string;
  };
  env: { ASSETS: { fetch: typeof fetch } };
  next: (request?: Request) => Promise<Response>;
}

export async function onRequestGet(context: EventContext) {
  const slug = context.params.slug;

  // Let Next.js internal requests pass through unchanged.
  if (slug.startsWith("__next")) {
    return context.next();
  }

  console.log("DYNAMIC EVENT FUNCTION HIT:", slug);

  const url = new URL("/events/view/", context.request.url);
  url.searchParams.set("slug", slug);

  const response = await context.next(new Request(url, context.request));
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", "max-age=31536000");
  if (headers.get("Content-Type")?.includes("text/html")) {
    // Pages does not apply static _headers rules to responses returned by Functions.
    const policy = await context.env.ASSETS.fetch(new URL("/security-policy.txt", url));
    if (!policy.ok) return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
    headers.set("Content-Security-Policy", await policy.text());
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-Frame-Options", "SAMEORIGIN");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
