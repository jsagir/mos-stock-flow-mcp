import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { fixture } from "../src/core/fixture.js";
import { serializeModel } from "../src/core/io.js";
import { renderSvg } from "../src/cli/commands.js";
import { createServer } from "../src/server/tools.js";

describe("shared /m:os contract across CLI, MCP and App", () => {
  it("preserves one model through MCP create, replace, get, export, and the App resource", async () => {
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    const client = new Client({ name: "mos-contract-test", version: "0.1.0" }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const listed = await client.listTools();
      const create = listed.tools.find(tool => tool.name === "model_create");
      expect(create?._meta?.ui).toMatchObject({ resourceUri: "ui://mos/systemicworks/editor.html" });
      const created = await client.callTool({ name: "model_create", arguments: { model: serializeModel(fixture) } });
      expect(created.isError).not.toBe(true);
      expect(created.structuredContent).toMatchObject({ model: { id: fixture.id, title: fixture.title } });

      const changed = { ...fixture, title: "A caller-supplied replacement" };
      const replaced = await client.callTool({ name: "model_update", arguments: { model: serializeModel(changed) } });
      expect(replaced.structuredContent).toMatchObject({ model: { id: fixture.id, title: changed.title } });
      const got = await client.callTool({ name: "model_get", arguments: { model: serializeModel(fixture) } });
      expect(got.structuredContent).toMatchObject({ model: { id: fixture.id, title: fixture.title } });
      const exported = await client.callTool({ name: "model_export", arguments: { model: serializeModel(changed), format: "svg" } });
      expect(exported.content?.some(item => item.type === "text" && item.text.includes("A caller-supplied replacement"))).toBe(true);

      const app = await client.readResource({ uri: "ui://mos/systemicworks/editor.html" });
      expect(app.contents.some(item => item.uri === "ui://mos/systemicworks/editor.html" && item.mimeType === "text/html;profile=mcp-app")).toBe(true);
      expect(app.contents[0]?.text.length).toBeLessThan(4_000_000);
      expect(renderSvg(changed)).toContain("A caller-supplied replacement");
    } finally {
      await client.close();
      await server.close();
    }
  });
});
