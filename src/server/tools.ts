import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LIMITS, type Model } from "../core/model.js";
import { parseModel, serializeModel } from "../core/io.js";
import { validateModel } from "../core/validate.js";
import { renderSvg } from "../cli/commands.js";
import { appHtml } from "./app-resource.js";

export function createServer() {
  const server = new McpServer({ name: "m:os-systems", version: "0.2.0" }, { maxToolInputElements: 12_000 });
  const modelArg = z.string().max(LIMITS.bytes);
  server.registerTool("model_create", { description: "Create a draft `/m:os` system model; pass a complete v1 JSON model. Returns the complete validated model.", inputSchema: { model: modelArg }, _meta: { ui: { resourceUri: "ui://mos/stock-flow/editor.html" } } }, async ({ model }) => {
    try { const parsed = parseModel(model); return { content: [{ type: "text", text: `Created draft: ${parsed.title}` }], structuredContent: { model: parsed } }; }
    catch (e) { return { isError: true, content: [{ type: "text", text: String(e) }] }; }
  });
  server.registerTool("model_update", { description: "Replace a model with a complete updated v1 JSON model. The server retains no model between calls.", inputSchema: { model: modelArg } }, async ({ model }) => {
    try { const parsed = parseModel(model); return { content: [{ type: "text", text: `Updated: ${parsed.title}` }], structuredContent: { model: parsed } }; }
    catch (e) { return { isError: true, content: [{ type: "text", text: String(e) }] }; }
  });
  server.registerTool("model_validate", { description: "Validate a complete `/m:os` model and return field-specific issues.", inputSchema: { model: modelArg } }, async ({ model }) => {
    try { const parsed = JSON.parse(model); const result = validateModel(parsed); return { content: [{ type: "text", text: result.ok ? `Valid: ${result.model.title}` : result.issues.map(i => `${i.path}: ${i.message}`).join("\n") }], structuredContent: result.ok ? { ok: true, model: result.model } : { ok: false, issues: result.issues } }; }
    catch (e) { return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] }; }
  });
  server.registerTool("model_get", { description: "Validate and return the complete model supplied by the caller. This server is stateless.", inputSchema: { model: modelArg } }, async ({ model }) => { const parsed = parseModel(model); return { content: [{ type: "text", text: serializeModel(parsed) }], structuredContent: { model: parsed } }; });
  server.registerTool("model_export", { description: "Export the supplied model as JSON or standalone inline-SVG HTML.", inputSchema: { model: modelArg, format: z.enum(["json", "svg"]).default("json") } }, async ({ model, format }) => { const parsed = parseModel(model); return { content: [{ type: "text", text: format === "svg" ? renderSvg(parsed) : serializeModel(parsed) }], structuredContent: { format, model: parsed } }; });
  server.registerResource("stock-flow-editor", "ui://mos/stock-flow/editor.html", { mimeType: "text/html;profile=mcp-app", description: "Interactive `/m:os` stock-and-flow editor", _meta: { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] } } } }, async () => ({ contents: [{ uri: "ui://mos/stock-flow/editor.html", mimeType: "text/html;profile=mcp-app", text: appHtml }] }));
  return server;
}
