import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { trpcServer } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { serveStatic } from "./lib/vite";

const app = new Hono();

// tRPC handler
app.use("/api/trpc/*", async (c) => {
  return trpcServer({
    router: appRouter,
    createContext,
    req: c.req.raw,
    endpoint: "/api/trpc",
  })(c.req.raw);
});

// OAuth callback
app.get("/api/oauth/callback", async (c) => {
  const { handleOAuthCallback } = await import("./kimi/auth");
  return handleOAuthCallback(c);
});

// Static files
serveStatic(app);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
