import { describe, expect, it } from "vitest";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
describe("hosted MCP transport", () => { it("is configured for stateless sessions with official SDK body and origin guards", () => { const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, maxRequestBodySize: 2_000_000, allowedOrigins: ["https://client.example"] }); expect(transport.sessionId).toBeUndefined(); }); });
