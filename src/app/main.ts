import { App } from "@modelcontextprotocol/ext-apps";
import { PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { fixture } from "../core/fixture.js";
import { validateModel } from "../core/validate.js";
import type { Model } from "../core/model.js";
const app = new App({ name: "/m:os systems canvas", version: "0.1.0" });
let model: Model = structuredClone(fixture);
let hostConnected = false;
const byId = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function redraw() {
  const svg = byId<SVGSVGElement>("map"); const defs = svg.querySelector("defs")?.outerHTML ?? ""; const ns = [...model.stocks, ...model.actors, ...model.levels];
  const position = (id: string, fallbackIndex: number) => model.layout.nodes[id] ?? { x: 90 + (fallbackIndex % 3) * 300, y: 100 + Math.floor(fallbackIndex / 3) * 180 };
  const nodeIndex = new Map(ns.map((node, index) => [node.id, index]));
  const pattern = (evidence: string) => evidence === "observed" || evidence === "reported" ? "evidenced" : evidence === "inferred" ? "inferred" : evidence === "hypothesis" ? "proposed" : "unknown";
  const nodes = ns.map((n, i) => { const p = position(n.id, i); const stock = model.stocks.some(s => s.id === n.id); const actor = model.actors.some(a => a.id === n.id); const kind = stock ? "STOCK / ACCUMULATION" : actor ? "ACTOR" : "NESTED LEVEL"; return `<g><rect x="${p.x}" y="${p.y}" width="220" height="88" fill="var(--white)" stroke="var(--ink)"/><text x="${p.x + 14}" y="${p.y + 30}" class="type">${kind}</text><text x="${p.x + 14}" y="${p.y + 58}" class="label">${esc(n.label)}</text></g>`; }).join("");
  const flows = model.flows.map((flow, i) => {
    const laneY = 355 + i * 32;
    const from = flow.fromStockId ? position(flow.fromStockId, nodeIndex.get(flow.fromStockId) ?? 0) : { x: 24, y: laneY };
    const to = flow.toStockId ? position(flow.toStockId, nodeIndex.get(flow.toStockId) ?? 0) : { x: 970, y: laneY };
    const startX = flow.fromStockId ? from.x + 220 : from.x; const startY = flow.fromStockId ? from.y + 44 : laneY;
    const endX = flow.toStockId ? to.x : to.x; const endY = flow.toStockId ? to.y + 44 : laneY;
    const path = `M${startX},${startY} L${startX},${laneY} L${endX},${laneY} L${endX},${endY}`;
    const source = flow.fromStockId ? (model.stocks.find(stock => stock.id === flow.fromStockId)?.label ?? flow.fromStockId) : "outside";
    const destination = flow.toStockId ? (model.stocks.find(stock => stock.id === flow.toStockId)?.label ?? flow.toStockId) : "outside";
    const label = `${flow.label} · ${source} → ${destination} · ${flow.evidence} · ${flow.unit ?? "rate unknown"}`;
    return `<path d="${path}" class="material ${pattern(flow.evidence)}" marker-end="url(#arrow)"/><text x="28" y="${laneY - 8}" class="flow">${esc(label)}</text>`;
  }).join("");
  const links = model.causalLinks.map(link => { const a = position(link.fromId, nodeIndex.get(link.fromId) ?? 0), b = position(link.toId, nodeIndex.get(link.toId) ?? 0); return `<path d="M${a.x + 220},${a.y + 44} L${b.x},${b.y + 44}" class="causal ${pattern(link.evidence)}" marker-end="url(#arrow)"/><text x="${a.x + 230}" y="${a.y + 30}" class="polarity">${link.polarity === "positive" ? "+" : link.polarity === "negative" ? "−" : "?"} · ${esc(link.evidence)} · ${esc(link.label ?? "influence")}</text>`; }).join("");
  svg.innerHTML = defs + flows + links + nodes;
  const materialFlows = byId<HTMLUListElement>("material-flows");
  materialFlows.replaceChildren(...model.flows.map(flow => {
    const source = flow.fromStockId ? (model.stocks.find(stock => stock.id === flow.fromStockId)?.label ?? flow.fromStockId) : "outside";
    const destination = flow.toStockId ? (model.stocks.find(stock => stock.id === flow.toStockId)?.label ?? flow.toStockId) : "outside";
    const item = document.createElement("li");
    item.textContent = `${source} flows to ${destination}: ${flow.label}; evidence: ${flow.evidence}; rate: ${flow.rate ?? "unknown"} ${flow.unit ?? ""}; delay: ${flow.delay ?? "unknown"}.`;
    return item;
  }));
  byId("flow-summary").textContent = model.flows.length ? `${model.flows.length} material flow${model.flows.length === 1 ? "" : "s"}. Arrow direction shows transfer between stocks or the system boundary.` : "No material flows are currently mapped.";
  const rels = byId<HTMLUListElement>("relationships");
  rels.replaceChildren(...model.causalLinks.map(link => {
    const source = ns.find(node => node.id === link.fromId)?.label ?? link.fromId;
    const destination = ns.find(node => node.id === link.toId)?.label ?? link.toId;
    const polarity = link.polarity === "positive" ? "positive influence" : link.polarity === "negative" ? "negative influence" : "unknown polarity";
    const item = document.createElement("li");
    item.textContent = `${source} has ${polarity} on ${destination}; evidence: ${link.evidence}; delay: ${link.delay ?? "unknown"}.`;
    return item;
  }));
  byId("relationship-summary").textContent = model.causalLinks.length ? `${model.causalLinks.length} causal relationship${model.causalLinks.length === 1 ? "" : "s"}. Each entry states source, destination, polarity, evidence status, and delay.` : "No causal relationships are currently mapped.";
  byId<HTMLTextAreaElement>("json").value = JSON.stringify(model, null, 2);
  byId<HTMLInputElement>("title").value = model.title; byId<HTMLInputElement>("boundary").value = model.boundary; byId<HTMLInputElement>("purpose").value = model.purpose;
}
function syncFields() { model.title = byId<HTMLInputElement>("title").value; model.boundary = byId<HTMLInputElement>("boundary").value; model.purpose = byId<HTMLInputElement>("purpose").value; }
function readEditorModel(): Model {
  syncFields();
  const result = validateModel(JSON.parse(byId<HTMLTextAreaElement>("json").value));
  if (!result.ok) throw new Error(result.issues.map(issue => `${issue.path}: ${issue.message}`).join("; "));
  return result.model;
}
function downloadModel() {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `${model.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "system"}.json`;
  link.click(); URL.revokeObjectURL(url);
}
function addStock() { const id = `stock-${model.stocks.length + 1}`; model.stocks.push({ id, label: `New stock ${model.stocks.length + 1}`, unit: null, value: null, evidence: "unknown" }); model.layout.nodes[id] = { x: 90 + ((model.stocks.length - 1) % 3) * 300, y: 300 + Math.floor((model.stocks.length - 1) / 3) * 140 }; redraw(); }
function addFlow() { model.flows.push({ id: `flow-${model.flows.length + 1}`, label: `New material flow ${model.flows.length + 1}`, toStockId: model.stocks[0]?.id ?? null, unit: null, rate: null, evidence: "unknown", delay: null }); redraw(); }
function addLink() { if (model.stocks.length < 2) { byId("status").textContent = "Add at least two stocks/elements before adding a causal link."; return; } model.causalLinks.push({ id: `link-${model.causalLinks.length + 1}`, fromId: model.stocks[0]!.id, toId: model.stocks[1]!.id, polarity: "unknown", evidence: "hypothesis", delay: null }); redraw(); }
function receiveModel(candidate: unknown) {
  let value = candidate;
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { byId("status").textContent = "The initiating tool supplied model text that is not valid JSON."; return false; } }
  if (!value || typeof value !== "object") return false;
  const result = validateModel(value);
  if (!result.ok) { byId("status").textContent = `The initiating model needs correction: ${result.issues.map(issue => `${issue.path}: ${issue.message}`).join("; ")}`; return false; }
  model = result.model; redraw(); byId("status").textContent = "Loaded the model supplied by the initiating MCP tool."; return true;
}
byId("add-stock").addEventListener("click", addStock); byId("add-flow").addEventListener("click", addFlow); byId("add-link").addEventListener("click", addLink);
byId("validate").addEventListener("click", async () => { try { model = readEditorModel(); redraw(); if (hostConnected) { const result = await app.callServerTool({ name: "model_validate", arguments: { model: JSON.stringify(model) } }); byId("status").textContent = result.content?.map(x => x.type === "text" ? x.text : "").join("\n") ?? "Validation response received."; } else byId("status").textContent = "Valid /m:os model. The complete model remains in this view."; } catch (e) { byId("status").textContent = `Check model JSON: ${String(e)}`; } });
byId("json").addEventListener("change", () => { try { if (!receiveModel(JSON.parse(byId<HTMLTextAreaElement>("json").value))) byId("status").textContent = "Model JSON needs correction."; } catch { byId("status").textContent = "Model JSON could not be parsed."; } });
byId("export").addEventListener("click", async () => { try { model = readEditorModel(); if (hostConnected) { const result = await app.callServerTool({ name: "model_update", arguments: { model: JSON.stringify(model) } }); if (result.isError) throw new Error(result.content?.map(x => x.type === "text" ? x.text : "").join("\n")); const returned = result.structuredContent as { model?: Model } | undefined; if (returned?.model) model = returned.model; await app.callServerTool({ name: "model_export", arguments: { model: JSON.stringify(model), format: "json" } }); } redraw(); downloadModel(); byId("status").textContent = "Downloaded the complete JSON model."; } catch (e) { byId("status").textContent = `Export failed: ${String(e)}`; } });
redraw();
app.ontoolinput = params => { const args = params.arguments as Record<string, unknown> | undefined; if (args && "model" in args) receiveModel(args.model); };
app.ontoolresult = params => { const content = params.structuredContent as { model?: unknown } | undefined; if (content?.model) receiveModel(content.model); };
void (async () => { try { await app.connect(new PostMessageTransport(window.parent, window.parent)); hostConnected = true; byId("status").textContent = "Connected to MCP Apps host. Model is held in this view and sent only when you invoke a tool."; } catch { byId("status").textContent = "Standalone view. Import and export JSON stay local."; } })();
