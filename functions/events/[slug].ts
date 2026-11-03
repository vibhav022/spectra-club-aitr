
interface EventContext {
  request: Request;
  params: {
    slug: string;
  };
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

  return context.next(new Request(url, context.request));
}
