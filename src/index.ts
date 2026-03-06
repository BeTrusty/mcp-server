import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { getConfig } from "@/config";
import { createMcpServer } from "@/server";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.0.1",
  });
});

// MCP endpoint — stateless, JSON-only (no SSE).
// GET is blocked: SSE requires long-lived connections incompatible with
// Vercel serverless. MCP clients (OpenCode, Claude, etc.) fall back to
// POST-only when they receive 405 on GET.
app.get("/mcp", (c) => {
  return c.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: "SSE not supported in serverless. Use POST." },
      id: null,
    },
    405,
  );
});

app.all("/mcp", async (c) => {
  const mcpServer = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,      // JSON response, no ReadableStream / SSE
  });
  await mcpServer.connect(transport);
  return transport.handleRequest(c.req.raw);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Standalone Bun server (local dev + Railway/Docker).
// Vercel imports this file as a module and uses `export default app` directly —
// import.meta.main is false in that context, so the server is NOT started.
if (import.meta.main) {
  const config = getConfig();

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    process.exit(0);
  });
  process.on("SIGINT", () => {
    console.log("Received SIGINT, shutting down gracefully...");
    process.exit(0);
  });

  console.log(`betrusty-mcp listening on port ${config.PORT}`);
  Bun.serve({ port: config.PORT, fetch: app.fetch });
}

// Vercel (and any Web Standard fetch environment) uses this export.
export default app;
