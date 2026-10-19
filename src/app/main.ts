import { App } from "@modelcontextprotocol/ext-apps";
import { PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { fixture } from "../core/fixture.js";
import { validateModel } from "../core/validate.js";
import type { Actor, CausalLink, Flow, Level, Model, Stock, Variable } from "../core/model.js";
import { renderDiagram } from "../core/diagram.js";
import { findFeedbackLoops } from "../core/loops.js";

const app = new App({ name: "/m:os systems canvas", version: "0.2.0" });
function readSharedModel(): Model | null {
  try {
    if (!location.hash.startsWith("#model=")) return null;
    const encoded = location.hash.slice(7).replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const result = validateModel(JSON.parse(new TextDecoder().decode(bytes)));
    return result.ok ? result.model : null;
  } catch { return null; }
}
function readSavedModel(): Model | null {
  try {
    const saved = localStorage.getItem("mos.systems-map.v1");
    if (!saved) return null;
    const result = validateModel(JSON.parse(saved));
    return result.ok ? result.model : null;
  } catch { return null; }
}
let model: Model = readSharedModel() ?? readSavedModel() ?? structuredClone(fixture);
let hostConnected = false;
let activeTool = "select";
let selected: { type: "node" | "flow" | "link"; id: string } | null = null;
let connectionStart: string | null = null;
let simValues: Record<string, number> | null = null;
let simTick = 0;
let playTimer: number | null = null;
let traceTimers: number[] = [];
let drag: { id: string; startX: number; startY: number; nodeX: number; nodeY: number; deltaX: number; deltaY: number; moved: boolean } | null = null;
const byId = <T extends Element>(id: string) => document.getElementById(id) as unknown as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const allNodes = () => [...model.stocks, ...(model.variables ?? []), ...model.actors, ...model.levels];
const findNode = (id: string) => allNodes().find(node => node.id === id);
const stopPlaying = () => { if (playTimer !== null) window.clearInterval(playTimer); playTimer = null; const button = byId<HTMLButtonElement>("play"); byId("play-label").textContent = "Play"; button.setAttribute("aria-label", "Start simulation"); button.querySelector("path")?.setAttribute("d", "M6 3l15 9-15 9z"); };
function redraw() {
  for (const timer of traceTimers) window.clearTimeout(timer);
  traceTimers = [];
  try { localStorage.setItem("mos.systems-map.v1", JSON.stringify(model)); } catch { /* Some MCP app hosts disable browser storage. */ }
  const svg = byId<SVGSVGElement>("map");
  const displayModel = simValues ? { ...model, stocks: model.stocks.map(stock => ({ ...stock, value: simValues![stock.id] ?? stock.value })) } : model;
  const diagram = renderDiagram(displayModel);
  svg.setAttribute("viewBox", diagram.viewBox); svg.innerHTML = diagram.markup;
  if (selected) svg.querySelector(`[data-${selected.type === "node" ? "node" : selected.type === "flow" ? "flow" : "link"}-id="${CSS.escape(selected.id)}"]`)?.classList.add("selected");
  byId("canvas-title").textContent = model.title || "Untitled system";
  byId<HTMLInputElement>("title").value = model.title; byId<HTMLInputElement>("purpose").value = model.purpose; byId<HTMLTextAreaElement>("boundary").value = model.boundary;
  byId<HTMLTextAreaElement>("json").value = JSON.stringify(model, null, 2);
  renderInspector(); updateSimulationStatus();
  renderFeedbackLoops();
}
function renderFeedbackLoops() {
  const list = byId<HTMLUListElement>("feedback-loops");
  const loops = findFeedbackLoops(model);
  list.replaceChildren();
  byId("loop-count").textContent = loops.length ? `${loops.length}${loops.length === 32 ? "+" : ""} found` : "None mapped yet";
  for (const loop of loops) {
    const item = document.createElement("li");
    const badge = document.createElement("span");
    badge.className = `loop-badge ${loop.kind}`;
    badge.textContent = loop.kind === "reinforcing" ? "R" : loop.kind === "balancing" ? "B" : "?";
    badge.setAttribute("aria-label", loop.kind);
    const label = document.createElement("span"); label.textContent = loop.label;
    item.append(badge, label); list.append(item);
  }
}
function updateSimulationStatus() {
  const values = simValues ?? Object.fromEntries(model.stocks.map(stock => [stock.id, stock.value]));
  const missingStocks = model.stocks.filter(stock => values[stock.id] == null).length;
  const missingRates = model.flows.filter(flow => flow.rate == null).length;
  const button = byId<HTMLButtonElement>("step");
  button.disabled = !model.stocks.length || missingStocks > 0 || missingRates > 0;
  byId("sim-status").textContent = simValues
    ? `Step ${simTick}. Fixed rates only; influences and stated delays are not simulated.`
    : missingStocks || missingRates
      ? `To play, enter a starting value for each stock and a fixed rate for each flow (${missingStocks} values, ${missingRates} rates missing).`
      : "Ready. Play uses constant rates for one step at a time.";
}
function field(label: string, value: string, change: (next: string) => void, type = "text", options?: string[]) {
  const wrap = document.createElement("label"); wrap.textContent = label;
  const input: HTMLInputElement | HTMLSelectElement = options ? document.createElement("select") : document.createElement("input");
  if (options) for (const option of options) { const item = document.createElement("option"); item.value = option; item.textContent = option; input.append(item); }
  else (input as HTMLInputElement).type = type;
  input.value = value;
  input.addEventListener("change", () => change(input.value)); wrap.append(input); return wrap;
}
function renderInspector() {
  const title = byId("selection-title"), detail = byId("selection-detail"); detail.replaceChildren();
  if (!selected) { title.textContent = "Selected item"; detail.innerHTML = "<p>Select a box or an arrow. Drag a box to move it.</p>"; return; }
  const makeField = (name: string, value: string, change: (next: string) => void, type = "text", options?: string[]) => detail.append(field(name, value, next => { change(next); redraw(); }, type, options));
  if (selected.type === "node") {
    const stock = model.stocks.find(item => item.id === selected!.id);
    const node = findNode(selected.id);
    if (!node) return;
    const variable = model.variables?.find(item => item.id === node.id);
    title.textContent = stock ? "Stock" : variable ? "Causal variable" : model.actors.some(item => item.id === node.id) ? "Actor" : "System level";
    makeField("Name", node.label, next => { node.label = next; });
    if (stock) {
      makeField("What accumulates", stock.description ?? "", next => { stock.description = next || undefined; });
      makeField("Starting amount", stock.value == null ? "" : String(stock.value), next => { stock.value = next === "" ? null : Number(next); simValues = null; }, "number");
      makeField("Unit", stock.unit ?? "", next => { stock.unit = next || null; });
      makeField("Evidence", stock.evidence, next => { stock.evidence = next as Stock["evidence"]; }, "text", ["observed", "reported", "inferred", "hypothesis", "unknown"]);
    } else if (variable) {
      makeField("What this condition means", variable.description ?? "", next => { variable.description = next || undefined; });
      makeField("Current value (optional)", variable.value == null ? "" : String(variable.value), next => { variable.value = next === "" ? null : Number(next); }, "number");
      makeField("Unit", variable.unit ?? "", next => { variable.unit = next || null; });
      makeField("Evidence", variable.evidence, next => { variable.evidence = next as Variable["evidence"]; }, "text", ["observed", "reported", "inferred", "hypothesis", "unknown"]);
    } else if ((node as Actor).description !== undefined) makeField("Role in the system", (node as Actor).description ?? "", next => { (node as Actor).description = next || undefined; });
    if (model.levels.some(level => level.id === node.id)) { const level = model.levels.find(item => item.id === node.id)!; makeField("Contained within", level.parentId ?? "none", next => { level.parentId = next === "none" ? null : next; }, "text", ["none", ...model.levels.filter(item => item.id !== level.id).map(item => item.id)]); }
  } else if (selected.type === "flow") {
    const flow = model.flows.find(item => item.id === selected!.id); if (!flow) return;
    title.textContent = "Material flow";
    const source = flow.fromStockId ? model.stocks.find(item => item.id === flow.fromStockId)?.label ?? flow.fromStockId : "outside this system"; const target = flow.toStockId ? model.stocks.find(item => item.id === flow.toStockId)?.label ?? flow.toStockId : "outside this system";
    const route = document.createElement("p"); route.textContent = `${source} → ${target}`; detail.append(route);
    makeField("What moves", flow.label, next => { flow.label = next; });
    makeField("Fixed rate per step", flow.rate == null ? "" : String(flow.rate), next => { flow.rate = next === "" ? null : Number(next); simValues = null; }, "number");
    makeField("Rate unit", flow.unit ?? "", next => { flow.unit = next || null; });
    makeField("Evidence", flow.evidence, next => { flow.evidence = next as Flow["evidence"]; }, "text", ["observed", "reported", "inferred", "hypothesis", "unknown"]);
    makeField("Delay (description only)", flow.delay ?? "", next => { flow.delay = next || null; });
  } else {
    const link = model.causalLinks.find(item => item.id === selected!.id); if (!link) return;
    title.textContent = "Causal influence";
    const source = findNode(link.fromId)?.label ?? link.fromId; const target = findNode(link.toId)?.label ?? link.toId; const route = document.createElement("p"); route.textContent = `${source} → ${target}`; detail.append(route);
    makeField("Claim", link.label ?? "", next => { link.label = next || undefined; });
    makeField("Polarity", link.polarity, next => { link.polarity = next as CausalLink["polarity"]; }, "text", ["positive", "negative", "unknown"]);
    makeField("Evidence", link.evidence, next => { link.evidence = next as CausalLink["evidence"]; }, "text", ["observed", "reported", "inferred", "hypothesis", "unknown"]);
    makeField("Delay (description only)", link.delay ?? "", next => { link.delay = next || null; });
  }
}
function setStatus(message: string, error = false) { const status = byId("status"); status.textContent = message; status.setAttribute("data-state", error ? "error" : "ready"); }
function newId(prefix: string) { const all = new Set([...allNodes(), ...model.flows, ...model.causalLinks, ...model.assumptions, ...model.evidence].map(item => item.id)); let i = 1; while (all.has(`${prefix}-${i}`)) i++; return `${prefix}-${i}`; }
function svgPoint(event: PointerEvent) { const svg = byId<SVGSVGElement>("map"); const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY; const matrix = svg.getScreenCTM(); return matrix ? point.matrixTransform(matrix.inverse()) : { x: 400, y: 300 }; }
function addStock(x: number, y: number) {
  const id = newId("stock"); model.stocks.push({ id, label: "New stock", unit: null, value: null, evidence: "unknown" }); model.layout.nodes[id] = { x: Math.max(0, x - 110), y: Math.max(0, y - 47) }; selected = { type: "node", id }; redraw(); setStatus("Stock added. Give it a clear name and unit.");
}
function addAuxiliary(kind: "variable" | "actor" | "level", x: number, y: number) {
  const id = newId(kind);
  if (kind === "variable") { model.schemaVersion = "1.1"; (model.variables ??= []).push({ id, label: "New variable", description: "", unit: null, value: null, evidence: "unknown" }); }
  else if (kind === "actor") model.actors.push({ id, label: "New actor", description: "" });
  else model.levels.push({ id, label: "New system level", parentId: null });
  model.layout.nodes[id] = { x: Math.max(0, x - (kind === "variable" ? 110 : 95)), y: Math.max(0, y - (kind === "variable" ? 47 : 36)) }; selected = { type: "node", id }; redraw(); setStatus(`${kind === "variable" ? "Causal variable" : kind === "actor" ? "Actor" : "System level"} added. Give it a clear name.`);
}
function connectNode(id: string) {
  if (!connectionStart) { connectionStart = id; selected = { type: "node", id }; byId("canvas-hint").textContent = "Now select the destination node."; redraw(); return; }
  if (connectionStart === id) { connectionStart = null; byId("canvas-hint").textContent = "Select a source, then a destination."; return; }
  if (activeTool === "flow") {
    if (!model.stocks.some(stock => stock.id === connectionStart) || !model.stocks.some(stock => stock.id === id)) { setStatus("A material flow must connect stocks. Choose two stock boxes.", true); connectionStart = null; return; }
    const flow: Flow = { id: newId("flow"), label: "New flow", fromStockId: connectionStart, toStockId: id, unit: null, rate: null, evidence: "unknown", delay: null };
    model.flows.push(flow); selected = { type: "flow", id: flow.id };
  } else {
    const link: CausalLink = { id: newId("influence"), fromId: connectionStart, toId: id, polarity: "positive", label: "Possible influence", evidence: "hypothesis", delay: null };
    model.causalLinks.push(link); selected = { type: "link", id: link.id };
  }
  connectionStart = null; byId("canvas-hint").textContent = activeTool === "flow" ? "Select two stocks to connect a flow." : "Select two items to connect an influence."; redraw();
}
function deleteSelection(id: string, kind: "node" | "flow" | "link") {
  if (kind === "flow") model.flows = model.flows.filter(item => item.id !== id);
  else if (kind === "link") model.causalLinks = model.causalLinks.filter(item => item.id !== id);
  else {
    model.stocks = model.stocks.filter(item => item.id !== id); model.variables = (model.variables ?? []).filter(item => item.id !== id); model.actors = model.actors.filter(item => item.id !== id); model.levels = model.levels.filter(item => item.id !== id);
    model.flows = model.flows.filter(item => item.fromStockId !== id && item.toStockId !== id); model.causalLinks = model.causalLinks.filter(item => item.fromId !== id && item.toId !== id); delete model.layout.nodes[id];
  }
  selected = null; simValues = null; redraw(); setStatus("Selected item and its connected lines removed.");
}
function selectTarget(target: Element) {
  const node = target.closest<SVGGElement>("[data-node-id]"); const flow = target.closest<SVGGElement>("[data-flow-id]"); const link = target.closest<SVGGElement>("[data-link-id]");
  if (node) selected = { type: "node", id: node.dataset.nodeId! };
  else if (flow) selected = { type: "flow", id: flow.dataset.flowId! };
  else if (link) selected = { type: "link", id: link.dataset.linkId! };
  else return null;
  return { node, flow, link };
}
function onCanvasPointerDown(event: PointerEvent) {
  const svg = byId<SVGSVGElement>("map"), target = event.target as Element, hit = selectTarget(target);
  if (activeTool === "trace") { if (hit?.node) traceFrom(hit.node.dataset.nodeId!); else setStatus("Select a variable or stock to trace its mapped influence paths."); return; }
  if (activeTool === "stock" || activeTool === "variable" || activeTool === "actor" || activeTool === "level") { if (hit) { setStatus("Choose an empty place on the canvas."); return; } const p = svgPoint(event); if (activeTool === "stock") addStock(p.x, p.y); else addAuxiliary(activeTool, p.x, p.y); return; }
  if (activeTool === "flow" || activeTool === "influence") { if (hit?.node) connectNode(hit.node.dataset.nodeId!); else setStatus("Select a system element on the canvas."); return; }
  if (activeTool === "delete") { if (hit?.node) deleteSelection(hit.node.dataset.nodeId!, "node"); else if (hit?.flow) deleteSelection(hit.flow.dataset.flowId!, "flow"); else if (hit?.link) deleteSelection(hit.link.dataset.linkId!, "link"); return; }
  if (activeTool === "select" && hit?.node) {
    const id = hit.node.dataset.nodeId!; const pos = model.layout.nodes[id]; const p = svgPoint(event);
    if (pos) { drag = { id, startX: p.x, startY: p.y, nodeX: pos.x, nodeY: pos.y, deltaX: 0, deltaY: 0, moved: false }; svg.setPointerCapture(event.pointerId); }
    redraw(); event.preventDefault();
  } else if (activeTool === "select" && hit) redraw();
}
function onCanvasPointerMove(event: PointerEvent) {
  if (!drag) return;
  const p = svgPoint(event);
  const dx = p.x - drag.startX, dy = p.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  drag.deltaX = dx; drag.deltaY = dy;
  const node = svg.querySelector<SVGGElement>(`[data-node-id="${CSS.escape(drag.id)}"]`);
  if (node) node.setAttribute("transform", `translate(${dx} ${dy})`);
}
function onCanvasPointerUp() {
  if (!drag) return;
  if (drag.moved) { const layout = model.layout.nodes[drag.id]!; layout.x += drag.deltaX; layout.y += drag.deltaY; }
  drag = null; redraw();
}
function traceFrom(startId: string) {
  const svg = byId<SVGSVGElement>("map");
  for (const timer of traceTimers) window.clearTimeout(timer);
  traceTimers = [];
  svg.querySelectorAll(".causal").forEach(link => link.classList.remove("trace-positive", "trace-negative", "trace-unknown"));
  const queue: Array<{ id: string; sign: "positive" | "negative" | "unknown"; path: Set<string> }> = [{ id: startId, sign: "positive", path: new Set([startId]) }];
  const seen = new Set<string>();
  const events: Array<{ linkId: string; sign: "positive" | "negative" | "unknown" }> = [];
  while (queue.length && events.length < 48) {
    const current = queue.shift()!;
    for (const link of model.causalLinks.filter(item => item.fromId === current.id)) {
      if (seen.has(link.id) || current.path.has(link.toId)) continue;
      seen.add(link.id);
      const sign = current.sign === "unknown" || link.polarity === "unknown" ? "unknown" : current.sign === link.polarity ? "positive" : "negative";
      events.push({ linkId: link.id, sign });
      const path = new Set(current.path); path.add(link.toId);
      queue.push({ id: link.toId, sign, path });
      if (events.length >= 48) break;
    }
  }
  if (!events.length) { setStatus("No outgoing influence links are mapped from this item."); return; }
  setStatus("Tracing possible influence paths. This is qualitative; it does not simulate rates, delays, or prove causes.");
  events.forEach((event, index) => {
    traceTimers.push(window.setTimeout(() => {
      const link = svg.querySelector<SVGGElement>(`[data-link-id="${CSS.escape(event.linkId)}"]`);
      link?.classList.add(`trace-${event.sign}`);
      traceTimers.push(window.setTimeout(() => link?.classList.remove(`trace-${event.sign}`), 750));
    }, index * 240));
  });
  traceTimers.push(window.setTimeout(() => setStatus(`Trace finished across ${events.length} mapped influence${events.length === 1 ? "" : "s"}. The result is a path exploration, not a prediction.`), events.length * 240 + 800));
}
function stepSimulation() {
  const current = simValues ?? Object.fromEntries(model.stocks.map(stock => [stock.id, stock.value ?? 0]));
  if (model.stocks.some(stock => stock.value == null && simValues?.[stock.id] == null) || model.flows.some(flow => flow.rate == null)) { updateSimulationStatus(); return; }
  const requested = new Map(model.flows.map(flow => [flow.id, Math.max(0, flow.rate ?? 0)]));
  const outgoing = new Map<string, number>();
  for (const flow of model.flows) if (flow.fromStockId) outgoing.set(flow.fromStockId, (outgoing.get(flow.fromStockId) ?? 0) + requested.get(flow.id)!);
  const scale = new Map<string, number>();
  for (const [id, total] of outgoing) scale.set(id, total > 0 ? Math.min(1, Math.max(0, current[id] ?? 0) / total) : 1);
  const delta = Object.fromEntries(model.stocks.map(stock => [stock.id, 0]));
  for (const flow of model.flows) {
    const amount = requested.get(flow.id)! * (flow.fromStockId ? scale.get(flow.fromStockId)! : 1);
    if (flow.fromStockId) delta[flow.fromStockId] -= amount;
    if (flow.toStockId) delta[flow.toStockId] += amount;
  }
  simValues = Object.fromEntries(model.stocks.map(stock => [stock.id, Math.max(0, (current[stock.id] ?? 0) + delta[stock.id])])); simTick++; redraw();
}
function setTool(tool: string) {
  activeTool = tool; connectionStart = null;
  document.querySelectorAll<HTMLButtonElement>(".tool").forEach(button => button.classList.toggle("active", button.id === `tool-${tool}`));
  const hints: Record<string, string> = { select: "Select a node to inspect it. Drag to move.", stock: "Click the canvas to place a stock.", flow: "Select a source stock, then a destination stock.", influence: "Select a source, then a destination. The claim starts as a hypothesis.", trace: "Select a starting variable to trace possible influence paths. This is qualitative, not a simulation.", variable: "Click the canvas to add a condition or factor. Use influence arrows to map possible causes.", actor: "Click the canvas to place an actor.", level: "Click the canvas to place a nested system level.", delete: "Select an item to remove it." };
  byId("canvas-hint").textContent = `${hints[tool] ?? ""}${window.matchMedia("(max-width: 850px)").matches ? " Swipe the map sideways to see more." : ""}`;
}
if (window.matchMedia("(max-width: 850px)").matches) byId("canvas-hint").textContent = "Select a node to inspect it. Swipe the map sideways to see more.";
function downloadModel() {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `${model.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "system"}.json`; link.click(); URL.revokeObjectURL(url);
}
function makeShareUrl() {
  const bytes = new TextEncoder().encode(JSON.stringify(model));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${location.href.split("#")[0]}#model=${encoded}`;
}
function receiveModel(candidate: unknown) {
  const value = typeof candidate === "string" ? (() => { try { return JSON.parse(candidate); } catch { return null; } })() : candidate;
  const result = validateModel(value);
  if (!result.ok) { setStatus(`Model needs correction: ${result.issues.map(issue => `${issue.path}: ${issue.message}`).join("; ")}`, true); return false; }
  model = result.model; selected = null; simValues = null; stopPlaying(); redraw(); setStatus("Model loaded. Edit it on the canvas or in Model JSON."); return true;
}

const svg = byId<SVGSVGElement>("map");
svg.addEventListener("pointerdown", onCanvasPointerDown); svg.addEventListener("pointermove", onCanvasPointerMove); svg.addEventListener("pointerup", onCanvasPointerUp); svg.addEventListener("pointercancel", onCanvasPointerUp);
byId("tool-select").addEventListener("click", () => setTool("select")); byId("tool-stock").addEventListener("click", () => setTool("stock")); byId("tool-flow").addEventListener("click", () => setTool("flow")); byId("tool-influence").addEventListener("click", () => setTool("influence")); byId("tool-trace").addEventListener("click", () => setTool("trace")); byId("tool-variable").addEventListener("click", () => setTool("variable")); byId("tool-actor").addEventListener("click", () => setTool("actor")); byId("tool-level").addEventListener("click", () => setTool("level")); byId("tool-delete").addEventListener("click", () => setTool("delete"));
byId<HTMLInputElement>("title").addEventListener("change", event => { model.title = (event.currentTarget as HTMLInputElement).value; redraw(); });
byId<HTMLInputElement>("purpose").addEventListener("change", event => { model.purpose = (event.currentTarget as HTMLInputElement).value; redraw(); });
byId<HTMLTextAreaElement>("boundary").addEventListener("change", event => { model.boundary = (event.currentTarget as HTMLTextAreaElement).value; redraw(); });
byId("load-example").addEventListener("click", () => receiveModel(structuredClone(fixture)));
byId("export").addEventListener("click", downloadModel);
byId("share").addEventListener("click", async () => {
  const url = makeShareUrl();
  if (url.length > 12_000) { setStatus("This map is too large for a share link. Save it as a JSON file instead.", true); return; }
  try { await navigator.clipboard.writeText(url); setStatus("Share link copied. The model is encoded in the link; it is not uploaded."); }
  catch { window.prompt("Copy this share link. Anyone with it can view the encoded model:", url); }
});
byId("import").addEventListener("click", () => byId<HTMLInputElement>("file-input").click());
byId<HTMLInputElement>("file-input").addEventListener("change", async event => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (file) { try { receiveModel(JSON.parse(await file.text())); } catch { setStatus("That file is not valid model JSON.", true); } } });
byId("validate").addEventListener("click", async () => { const result = validateModel(JSON.parse(byId<HTMLTextAreaElement>("json").value)); if (!result.ok) { setStatus(result.issues.map(issue => `${issue.path}: ${issue.message}`).join("; "), true); return; } model = result.model; redraw(); if (hostConnected) { const response = await app.callServerTool({ name: "model_validate", arguments: { model: JSON.stringify(model) } }); setStatus(response.content?.map(item => item.type === "text" ? item.text : "").join("\n") ?? "Model validated."); } else setStatus("Model is valid."); });
byId<HTMLTextAreaElement>("json").addEventListener("change", event => { try { receiveModel(JSON.parse((event.currentTarget as HTMLTextAreaElement).value)); } catch { setStatus("Model JSON could not be parsed.", true); } });
byId("play").addEventListener("click", () => {
  const missingStocks = model.stocks.some(stock => stock.value == null && simValues?.[stock.id] == null), missingRates = model.flows.some(flow => flow.rate == null);
  if (missingStocks || missingRates) { setStatus("Add a starting amount to each stock and a fixed rate to each flow before playing. No values will be invented.", true); return; }
  if (playTimer !== null) { stopPlaying(); return; }
  const button = byId<HTMLButtonElement>("play"); byId("play-label").textContent = "Pause"; button.setAttribute("aria-label", "Pause simulation"); button.querySelector("path")?.setAttribute("d", "M6 4h4v16H6zm8 0h4v16h-4z"); playTimer = window.setInterval(stepSimulation, 850);
});
byId("step").addEventListener("click", stepSimulation);
byId("reset").addEventListener("click", () => { stopPlaying(); simValues = null; simTick = 0; redraw(); });
redraw();
app.ontoolinput = params => { const args = params.arguments as Record<string, unknown> | undefined; if (args && "model" in args) receiveModel(args.model); };
app.ontoolresult = params => { const content = params.structuredContent as { model?: unknown } | undefined; if (content?.model) receiveModel(content.model); };
void (async () => { try { await app.connect(new PostMessageTransport(window.parent, window.parent)); hostConnected = true; setStatus("Connected to MCP Apps host. The draft stays here unless you invoke a server tool."); } catch { setStatus("Standalone canvas. Import and export stay on this device."); } })();
