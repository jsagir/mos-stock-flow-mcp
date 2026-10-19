import { describe, expect, it } from "vitest";
import { fixture } from "../src/core/fixture.js";
import { serializeModel } from "../src/core/io.js";
import { handleHealthRequest, handleMcpRequest } from "../src/server/vercel.js";

describe("shared Vercel MCP deployment handlers", () => {
  it("serves a health route and the stateless Streamable HTTP MCP protocol", async () => {
    expect(await handleHealthRequest().json()).toEqual({ ok: true, service: "/m:os" });
    const invoke = async (body: unknown, initialized = true) => handleMcpRequest(new Request("https://mos-stock-flow-mcp.vercel.app/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(initialized ? { "mcp-protocol-version": "2025-03-26" } : {}),
      },
      body: JSON.stringify(body),
    }));

    const initialized = await invoke({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } } }, false);
    expect(initialized.status).toBe(200);
    const initResult = await initialized.json();
    expect(initResult.result.serverInfo.name).toBe("m:os-systems");

    const listed = await invoke({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect((await listed.json()).result.tools.map((tool: { name: string }) => tool.name)).toContain("model_create");

    const called = await invoke({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "model_validate", arguments: { model: serializeModel(fixture) } } });
    expect((await called.json()).result.structuredContent.ok).toBe(true);
  });

  it("keeps the endpoint POST-only", async () => {
    expect((await handleMcpRequest(new Request("https://mos-stock-flow-mcp.vercel.app/mcp"))).status).toBe(405);
  });
});
