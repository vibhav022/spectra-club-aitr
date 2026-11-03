import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env";
import { HttpError } from "./lib/http";
import { allowedOrigins, csrfGuard, requireAdmin } from "./lib/auth";
import { maybeCleanup, setMediaEndpoint } from "./lib/media";
import { auth } from "./routes/auth";
import { team } from "./routes/team";
import { faculty } from "./routes/faculty";
import { gallery, categories } from "./routes/gallery";
import { event } from "./routes/event";
import { catalogueEvents, publicCatalogueEvents } from "./routes/catalogue-events";
import { uploads } from "./routes/uploads";
import { publicApi } from "./routes/public";
import { summary } from "./routes/summary";

const app = new Hono<AppEnv>().basePath("/api");

app.use("*", async (c, next) => { setMediaEndpoint(c.env); await next(); });
app.use("*", cors({
  origin: (origin, c) => (origin && allowedOrigins(c.env).includes(origin) ? origin : null),
  credentials: true, allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-Requested-With"], maxAge: 600,
}));
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "no-referrer");
  if (!c.res.headers.has("Cache-Control")) c.header("Cache-Control", "no-store");
});

app.get("/health", async (c) => { await c.env.DB.prepare("SELECT 1").first(); return c.json({ ok: true }); });
app.route("/public", publicApi);
app.route("/public/events", publicCatalogueEvents);

app.use("/auth/*", csrfGuard);
app.route("/auth", auth);

const admin = new Hono<AppEnv>();
admin.use("*", csrfGuard, requireAdmin);          // every admin route: origin check + valid session, server-side
admin.use("*", async (c, next) => { await next(); await maybeCleanup(c.env, c.executionCtx); });  // no cron on Pages: tidy up at most every 6 h
admin.route("/team", team.admin);
admin.route("/faculty", faculty.admin);
admin.route("/gallery", gallery);
admin.route("/categories", categories);
admin.route("/events", event);
admin.route("/catalogue-events", catalogueEvents);
admin.route("/uploads", uploads);
admin.route("/summary", summary);
app.route("/admin", admin);

app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));
app.onError((err, c) => {
  if (err instanceof HttpError) {
    if (err.code === "rate_limited") c.header("Retry-After", String((err.details as { retryAfter: number }).retryAfter));
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status as 400);
  }
  console.error("Unhandled error", err);
  return c.json({ error: { code: "server_error", message: "Something went wrong. Nothing was saved; please try again." } }, 500);
});

export default app;
