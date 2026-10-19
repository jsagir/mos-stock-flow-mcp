import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "./tools.js";
const maxBodyBytes = 2_000_000;
const allowedOrigins = (process.env.MCP_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean);
export async function handleMcpRequest(request) {
    if (request.method !== "POST")
        return new Response(null, { status: 405, headers: { allow: "POST" } });
    const origin = request.headers.get("origin");
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        return Response.json({ error: "Origin is not allowed." }, { status: 403 });
    }
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        maxRequestBodySize: maxBodyBytes,
        enableJsonResponse: true,
        ...(productionHost ? { allowedHosts: [productionHost] } : {}),
        ...(allowedOrigins.length ? { allowedOrigins } : {}),
    });
    const server = createServer();
    await server.connect(transport);
    try {
        const response = await transport.handleRequest(request);
        const body = await response.arrayBuffer();
        return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    catch {
        return Response.json({ error: "Invalid MCP request." }, { status: 400 });
    }
    finally {
        await server.close();
    }
}
export function handleHealthRequest() {
    return Response.json({ ok: true, service: "/m:os" }, { headers: { "cache-control": "no-store" } });
}
