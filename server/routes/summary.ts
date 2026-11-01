import { Hono } from "hono";
import type { AppEnv } from "../env";
import { listEvents, shape } from "./event";

export const summary = new Hono<AppEnv>();
summary.get("/", async (c) => {
  const n = async (sql: string) => (await c.env.DB.prepare(sql).first<{ n: number }>())!.n;
  const events = (await listEvents(c.env)).map(shape);
  const cutoff = Date.now() - 864e5;
  const upcoming = events.filter((e) => new Date(e.startsAt).getTime() > cutoff);
  return c.json({
    team: { total: await n("SELECT COUNT(*) n FROM team_members"), visible: await n("SELECT COUNT(*) n FROM team_members WHERE visible=1") },
    faculty: { total: await n("SELECT COUNT(*) n FROM faculty"), visible: await n("SELECT COUNT(*) n FROM faculty WHERE visible=1") },
    gallery: {
      total: await n("SELECT COUNT(*) n FROM gallery_items"), visible: await n("SELECT COUNT(*) n FROM gallery_items WHERE visible=1"),
      images: await n("SELECT COUNT(*) n FROM gallery_items WHERE kind='image'"), videos: await n("SELECT COUNT(*) n FROM gallery_items WHERE kind='video'"),
    },
    storageBytes: await n("SELECT COALESCE(SUM(size_bytes),0) n FROM media WHERE status='ready'"),
    events: { total: events.length, showing: upcoming.filter((e) => e.visible).length, next: upcoming.find((e) => e.visible) ?? upcoming[0] ?? null },
  });
});
