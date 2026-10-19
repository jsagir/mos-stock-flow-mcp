import { describe, expect, it } from "vitest";
import { createServer } from "../src/server/tools.js";
import { appHtml } from "../src/server/app-resource.js";
import { readFileSync } from "node:fs";
describe("MCP server contract", () => {
  it("registers server and supports stateless construction", () => { const server = createServer(); expect(server).toBeTruthy(); });
  it("provides a self-contained app resource with no remote asset tags", () => { expect(appHtml).toContain("/m:os"); expect(appHtml).not.toMatch(/<(?:script|link|img|iframe)[^>]+(?:src|href)=[\"']https?:\/\//i); });
  it("declares a restrictive MCP Apps resource policy", () => { const tools = readFileSync(new URL("../src/server/tools.ts", import.meta.url), "utf8"); expect(tools).toContain("baseUriDomains: []"); expect(tools).toContain("connectDomains: []"); });
});
