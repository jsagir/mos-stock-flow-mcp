import { App } from "@modelcontextprotocol/ext-apps";
import type { Model } from "../core/model.js";
import { findFeedbackLoops } from "../core/loops.js";
import { saveCanonicalModel } from "./systemicworks-store.js";

interface CanvasModel {
  serialize(): string;
  deserialize(raw: string, filename: string): void;
}
interface CanvasHost { model: CanvasModel; }
interface MpcToolResult { structuredContent?: { model?: unknown }; content?: Array<{ type?: string; text?: string }>; isError?: boolean; }

const colors = { stock: "%231f3fbf", variable: "%23596d87", actor: "%23905f18", level: "%235b6572", outside: "%23717883", flow: "%231f3fbf", positive: "%23596d87", negative: "%23b34f52", unknown: "%23805f20" };
const enc = (value: string) => encodeURIComponent(value);
const text = (value: unknown) => typeof value === "string" ? value : "";

export function toProject(model: Model): string {
  type Item = { id: string; label: string; kind: "stock" | "variable" | "actor" | "level" | "outside"; x: number; y: number };
  const items: Item[] = [];
  const positions = new Map<string, number>();
  const addGroup = (values: Array<{ id: string; label: string }>, kind: Item["kind"], row: number) => values.forEach((item, index) => {
    const layout = model.layout?.nodes?.[item.id];
    positions.set(item.id, items.length + 1);
    items.push({ id: item.id, label: item.label, kind, x: Number.isFinite(layout?.x) ? layout!.x : 150 + (index % 5) * 180, y: Number.isFinite(layout?.y) ? layout!.y : row + Math.floor(index / 5) * 150 });
  });
  addGroup(model.stocks, "stock", 300);
  addGroup(model.variables ?? [], "variable", 130);
  addGroup(model.actors, "actor", 510);
  addGroup(model.levels, "level", 650);
  const flows = model.flows ?? [];
  const needsIn = flows.some(flow => !flow.fromStockId);
  const needsOut = flows.some(flow => !flow.toStockId);
  if (needsIn) { positions.set("__outside_in", items.length + 1); items.push({ id: "__outside_in", label: "Outside this system", kind: "outside", x: 70, y: 300 }); }
  if (needsOut) { positions.set("__outside_out", items.length + 1); items.push({ id: "__outside_out", label: "Outside this system", kind: "outside", x: 940, y: 300 }); }
  const nodes = items.map(item => {
    const kindLabel = item.kind === "stock" ? "Stock · " : item.kind === "variable" ? "Condition · " : item.kind === "actor" ? "Actor · " : item.kind === "level" ? "Level · " : "Boundary · ";
    const color = colors[item.kind];
    const width = item.kind === "stock" ? Math.max(80, Math.min(120, 55 + item.label.length * 2.2)) : Math.max(55, Math.min(100, 28 + item.label.length * 2.5));
    const height = item.kind === "stock" ? 34 : 24;
    return [positions.get(item.id), Math.round(item.x), Math.round(item.y), 0, enc(kindLabel + item.label), enc(decodeURIComponent(color)), width, height];
  });
  const edges: unknown[][] = [];
  const labels: unknown[][] = [[330, 45, enc(model.title || "System map"), enc(decodeURIComponent(colors.variable))]];
  const addLabel = (x: number, y: number, label: string, color: string) => labels.push([Math.round(x), Math.round(y), enc(label), enc(decodeURIComponent(color))]);
  let inflowNumber = 0; let outflowNumber = 0; let internalFlowNumber = 0;
  for (const flow of flows) {
    const from = flow.fromStockId ? positions.get(flow.fromStockId) : positions.get("__outside_in");
    const to = flow.toStockId ? positions.get(flow.toStockId) : positions.get("__outside_out");
    if (!from || !to) continue;
    const source = items[from - 1]!; const target = items[to - 1]!;
    edges.push([from, to, 100, 1, 0, 5, colors.flow, 0]);
    const direction = !flow.fromStockId ? `IN${++inflowNumber}` : !flow.toStockId ? `OUT${++outflowNumber}` : `F${++internalFlowNumber}`;
    addLabel((source.x + target.x) / 2, (source.y + target.y) / 2 - 35, `@FLOW@ ${direction}`, colors.flow);
  }
  const links = model.causalLinks ?? [];
  for (const link of links) {
    const from = positions.get(link.fromId); const to = positions.get(link.toId);
    if (!from || !to) continue;
    const sign = link.polarity === "positive" ? 1 : link.polarity === "negative" ? -1 : 0;
    const color = link.polarity === "positive" ? colors.positive : link.polarity === "negative" ? colors.negative : colors.unknown;
    edges.push([from, to, 100, sign, 0, 2, color, 0]);
  }
  const project = [nodes, edges, labels, items.length + 1, []];
  return `[2,0,0]'${JSON.stringify(project)}`;
}

function renderModel(host: CanvasHost, model: Model): void {
  const raw = JSON.stringify(model);
  host.model.deserialize(toProject(model), "mos-system-map.smwks");
  saveCanonicalModel(raw);
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  sidebar.replaceChildren();
  const panel = document.createElement("section");
  panel.className = "mos-model-panel";
  const heading = document.createElement("h2"); heading.textContent = model.title || "System map"; panel.append(heading);
  const intro = document.createElement("p"); intro.textContent = model.purpose || "A system map supplied by the MCP modeler."; panel.append(intro);
  const boundary = document.createElement("p"); const boundaryTitle = document.createElement("b"); boundaryTitle.textContent = "Boundary"; boundary.append(boundaryTitle, document.createElement("br"), document.createTextNode(text(model.boundary) || "Not specified")); panel.append(boundary);
  const legend = document.createElement("p"); legend.className = "mos-map-legend"; legend.textContent = "Boxes = accumulations · blue pipes and valve marks = material flows · thin arrows with + / − / ? = possible influences. This map shows structure; it does not simulate quantities."; panel.append(legend);
  type Row = { label?: string; text?: string; status?: string; evidence?: string; rate?: number | null; unit?: string | null; polarity?: Model["causalLinks"][number]["polarity"]; fromStockId?: string | null; toStockId?: string | null };
  const addList = (title: string, values: Row[], formatter?: (item: Row) => string) => {
    const section = document.createElement("section"); const h = document.createElement("h3"); h.textContent = `${title} · ${values.length}`; section.append(h);
    const ul = document.createElement("ul");
    for (const value of values) { const li = document.createElement("li"); li.textContent = formatter ? formatter(value) : `${value.label || value.text || "Untitled"}${value.evidence || value.status ? ` · ${value.evidence || value.status}` : ""}`; ul.append(li); }
    if (!values.length) { const li = document.createElement("li"); li.textContent = "None mapped"; ul.append(li); }
    section.append(ul); panel.append(section);
  };
  addList("Stocks", model.stocks);
  let inflowIndex = 0; let outflowIndex = 0; let internalIndex = 0;
  addList("Flows", model.flows, flow => {
    const mark = !flow.fromStockId ? `IN${++inflowIndex}` : !flow.toStockId ? `OUT${++outflowIndex}` : `F${++internalIndex}`;
    return `${mark} · ${flow.label} · ${flow.rate == null ? "rate unknown" : `${flow.rate}${flow.unit ? ` ${flow.unit}` : ""}`} · ${flow.evidence}`;
  });
  addList("Influences", model.causalLinks, link => `${link.polarity === "positive" ? "+" : link.polarity === "negative" ? "−" : "?"} ${link.label || "Influence"} · ${link.evidence}`);
  addList("Actors", model.actors);
  addList("System levels", model.levels);
  addList("Assumptions", model.assumptions);
  addList("Evidence notes", model.evidence);
  const loops = findFeedbackLoops(model);
  addList("Feedback loops", loops.map(loop => ({ label: `${loop.kind === "reinforcing" ? "R · reinforcing" : loop.kind === "balancing" ? "B · balancing" : "? · sign unknown"} · ${loop.label}` })));
  const actions = document.createElement("div"); actions.className = "mos-model-actions";
  const open = document.createElement("button"); open.type = "button"; open.textContent = "Open another /m:os JSON"; open.addEventListener("click", () => window.dispatchEvent(new Event("mos-open-model-file")));
  const save = document.createElement("button"); save.type = "button"; save.textContent = "Save /m:os JSON";
  save.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(model, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${(model.title || "system-map").replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.json`; anchor.click(); URL.revokeObjectURL(url);
  });
  actions.append(open, save); panel.append(actions); sidebar.append(panel);
  const title = document.getElementById("canvas-title"); if (title) title.textContent = model.title || "System map";
  const playbar = document.getElementById("playbar"); if (playbar) playbar.replaceChildren();
  const bar = document.getElementById("bar");
  if (bar && !document.getElementById("mos-mcp-badge")) { const badge = document.createElement("span"); badge.id = "mos-mcp-badge"; badge.textContent = "MCP SYSTEM MAP"; bar.append(badge); }
}

export function attachSystemicWorksMcpBridge(host: CanvasHost): void {
  const restore = (event: Event) => {
    const raw = (event as CustomEvent<string>).detail;
    try { const parsed = JSON.parse(raw) as Model; if (parsed && Array.isArray(parsed.stocks)) renderModel(host, parsed); } catch { /* Ignore invalid stored content. */ }
  };
  window.addEventListener("mos-model-restored", restore);
  const fileInput = document.createElement("input");
  fileInput.type = "file"; fileInput.accept = "application/json,.json"; fileInput.hidden = true;
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0]; fileInput.value = ""; if (!file) return;
    try {
      const model = JSON.parse(await file.text()) as Model;
      if (!model || !Array.isArray(model.stocks) || !Array.isArray(model.flows) || !Array.isArray(model.causalLinks)) throw new Error("This file is not a `/m:os` system model.");
      renderModel(host, model);
    } catch (error) {
      const status = document.getElementById("local-save-status");
      if (status) status.textContent = error instanceof Error ? error.message : "Could not open this model file.";
    }
  });
  document.body.append(fileInput);
  window.addEventListener("mos-open-model-file", () => fileInput.click());
  const app = new App({ name: "/m:os SystemicWorks editor", version: "0.3.0" }, {});
  app.ontoolresult = params => {
    const result = params as unknown as MpcToolResult;
    const model = result.structuredContent?.model;
    if (result.isError || !model || typeof model !== "object") return;
    if (!Array.isArray((model as Model).stocks)) return;
    renderModel(host, model as Model);
  };
  if (window.parent !== window) void app.connect().catch(() => { /* Local browser mode has no MCP host. */ });
}
