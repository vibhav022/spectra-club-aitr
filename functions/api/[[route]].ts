import { handle } from "hono/cloudflare-pages";
import app from "../../server/app";

// Cloudflare Pages Function: every request to /api/* on the same domain as the site is answered by the Hono app in /server.
export const onRequest = handle(app);
