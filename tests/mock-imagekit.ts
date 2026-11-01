/** A tiny stand-in for ImageKit (upload API, media API and CDN) so the real Pages Functions can be tested offline. */
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";

export const PRIVATE_KEY = "private_test_key=";
export const PORT = Number(process.env.MOCK_IK_PORT ?? 9911);
export const files = new Map<string, { filePath: string; data: Buffer }>();

export function start() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, `http://127.0.0.1:${PORT}`);
    const json = (code: number, body: unknown) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
    const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks);
    const authed = req.headers.authorization === `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString("base64")}`;

    if (req.method === "POST" && url.pathname === "/upload") {
      const form = await new Request("http://x/", { method: "POST", headers: { "content-type": req.headers["content-type"]! }, body: raw }).formData();
      const f = (k: string) => String(form.get(k) ?? "");
      const expect = createHmac("sha1", PRIVATE_KEY).update(f("token") + f("expire")).digest("hex");
      if (expect !== f("signature") || Number(f("expire")) < Date.now() / 1000) return json(401, { message: "Invalid signature" });
      const file = form.get("file") as File; const fileId = randomUUID().replace(/-/g, "").slice(0, 24);
      const filePath = `${f("folder")}/${f("fileName")}`;
      files.set(fileId, { filePath, data: Buffer.from(await file.arrayBuffer()) });
      return json(200, { fileId, filePath, name: f("fileName"), size: file.size });
    }
    if (url.pathname.startsWith("/v1/")) {
      if (!authed) return json(401, { message: "bad key" });
      const m = /^\/v1\/files\/([^/]+)(\/details)?$/.exec(url.pathname);
      if (m && req.method === "GET") { const f = files.get(m[1]); return f ? json(200, { fileId: m[1], filePath: f.filePath, size: f.data.length, name: f.filePath.split("/").pop() }) : json(404, { message: "not found" }); }
      if (m && req.method === "DELETE") { if (!files.delete(m[1])) return json(404, {}); res.writeHead(204); return res.end(); }
      if (url.pathname === "/v1/files" && req.method === "GET") {
        const name = /name = "([^"]+)"/.exec(url.searchParams.get("searchQuery") ?? "")?.[1];
        return json(200, [...files].filter(([, f]) => f.filePath === `${url.searchParams.get("path")}/${name}`).map(([fileId, f]) => ({ fileId, filePath: f.filePath, size: f.data.length, name })));
      }
    }
    if (url.pathname.startsWith("/ik/test/")) {   // CDN
      const path = url.pathname.slice("/ik/test".length);
      const hit = [...files.values()].find((f) => f.filePath === path);
      if (!hit) { res.writeHead(404); return res.end(); }
      const range = /bytes=(\d+)-(\d+)/.exec(String(req.headers.range ?? ""));
      if (range) { res.writeHead(206, { "Content-Type": "application/octet-stream" }); return res.end(hit.data.subarray(Number(range[1]), Number(range[2]) + 1)); }
      res.writeHead(200); return res.end(hit.data);
    }
    res.writeHead(404); res.end();
  });
  return new Promise<typeof server>((r) => server.listen(PORT, "127.0.0.1", () => r(server)));
}
