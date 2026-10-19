import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./tools.js";
const port = Number(process.env.PORT ?? 3000);
const maxBodyBytes = 2_000_000;
const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean);
const httpServer = createHttpServer(async (req, res) => {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
  if (req.url === "/health" && req.method === "GET") { res.writeHead(200, { "content-type": "application/json" }); res.end('{"ok":true,"service":"/m:os"}'); return; }
  if (req.url !== "/mcp") { res.writeHead(404).end(); return; }
  if (req.method !== "POST") { res.writeHead(405, { allow: "POST" }).end(); return; }
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) { res.writeHead(403, { "content-type": "application/json" }).end('{"error":"Origin is not allowed. Configure MCP_ALLOWED_ORIGINS with the exact client origin."}'); return; }
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, maxRequestBodySize: maxBodyBytes, ...(allowedOrigins.length ? { allowedOrigins } : {}) });
  const server = createServer(); await server.connect(transport);
  try { await transport.handleRequest(req, res); } catch { if (!res.headersSent) res.writeHead(400).end(); }
  finally { await server.close(); }
});
httpServer.listen(port, "0.0.0.0", () => process.stderr.write(`/m:os MCP listening on ${port}\n`));
