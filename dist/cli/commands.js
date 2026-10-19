import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { parseModel, serializeModel } from "../core/io.js";
import { fixture } from "../core/fixture.js";
async function input(path) {
    if (path && path !== "-")
        return readFile(path, "utf8");
    let data = "";
    for await (const chunk of stdin)
        data += chunk;
    return data;
}
export function renderSvg(m) {
    const positions = m.layout.nodes;
    const esc = (s) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const fontFile = (name) => `data:font/ttf;base64,${readFileSync(new URL(`../app/assets/fonts/${name}`, import.meta.url)).toString("base64")}`;
    const fonts = `@font-face{font-family:'DM Sans';src:url('${fontFile("DM-Sans-variable.ttf")}');font-weight:100 900}@font-face{font-family:Figtree;src:url('${fontFile("Figtree-variable.woff2").replace("font/ttf", "font/woff2")}');font-weight:100 900}@font-face{font-family:Heebo;src:url('${fontFile("Heebo-variable.ttf")}');font-weight:100 900}@font-face{font-family:'JetBrains Mono';src:url('${fontFile("JetBrains-Mono-variable.ttf")}');font-weight:100 900}`;
    const lockup = `data:image/svg+xml;base64,${readFileSync(new URL("../app/assets/mos-lockup-transparent-v2.svg", import.meta.url)).toString("base64")}`;
    const allNodes = [...m.stocks, ...m.actors, ...m.levels];
    const stocks = new Set(m.stocks.map(n => n.id));
    const actors = new Set(m.actors.map(n => n.id));
    const nodes = allNodes.map((n, i) => { const p = positions[n.id] ?? { x: 120 + i * 220, y: 140 }; const kind = stocks.has(n.id) ? "STOCK / ACCUMULATION" : actors.has(n.id) ? "ACTOR" : "LEVEL"; return `<g><rect x="${p.x}" y="${p.y}" width="220" height="86" fill="var(--white)" stroke="var(--ink)"/><text x="${p.x + 12}" y="${p.y + 25}" class="kind">${kind}</text><text x="${p.x + 12}" y="${p.y + 53}" class="node-label">${esc(n.label)}</text></g>`; }).join("");
    const dash = (status) => status === "observed" || status === "reported" ? "solid" : status === "inferred" ? "inferred" : status === "hypothesis" ? "proposed" : "unknown";
    const nodeIndex = new Map(allNodes.map((node, index) => [node.id, index]));
    const point = (id) => positions[id] ?? { x: 120 + (nodeIndex.get(id) ?? 0) * 220, y: 140 };
    const edges = m.causalLinks.map(e => { const a = point(e.fromId), b = point(e.toId); const pol = e.polarity === "positive" ? "+" : e.polarity === "negative" ? "−" : "?"; return `<path d="M${a.x + 220},${a.y + 43} L${b.x},${b.y + 43}" class="relation ${dash(e.evidence)}" marker-end="url(#arrow)"/><text x="${(a.x + b.x + 220) / 2}" y="${a.y + 27}" class="relation-label">${pol} · ${esc(e.evidence)} · ${esc(e.label ?? "influence")}</text>`; }).join("");
    const material = m.flows.map((f, i) => { const laneY = 390 + i * 30; const from = f.fromStockId ? point(f.fromStockId) : { x: 20, y: laneY }; const to = f.toStockId ? point(f.toStockId) : { x: 970, y: laneY }; const startX = f.fromStockId ? from.x + 220 : from.x, startY = f.fromStockId ? from.y + 43 : laneY; const endX = to.x, endY = f.toStockId ? to.y + 43 : laneY; const source = f.fromStockId ? (m.stocks.find(s => s.id === f.fromStockId)?.label ?? f.fromStockId) : "outside"; const destination = f.toStockId ? (m.stocks.find(s => s.id === f.toStockId)?.label ?? f.toStockId) : "outside"; const label = `${f.label} · ${source} → ${destination} · ${f.evidence} · ${f.unit ?? "rate unknown"}`; return `<path d="M${startX},${startY} L${startX},${laneY} L${endX},${laneY} L${endX},${endY}" class="material ${dash(f.evidence)}" marker-end="url(#arrow)"/><text x="20" y="${laneY - 8}" class="flow">${esc(label)}</text>`; }).join("");
    return `<!doctype html><html data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.title)} | /m:os</title><style>${fonts}:root{--paper:#F7F5EE;--white:#FFFFFF;--ink:#111111;--soft:#4B4943;--blue:#1F3FBF;--red:#D6281F;--yellow:#F2C200;--quiet:#ECEAE2;--body:"DM Sans",Heebo,sans-serif;--display:Figtree,Heebo,sans-serif;--code:"JetBrains Mono",monospace}*{box-sizing:border-box}body{margin:0;padding:24px;background:var(--paper);color:var(--ink);font:16px/1.55 var(--body)}h1{font:700 2rem/1.1 var(--display)}svg{width:100%;min-height:520px;background:var(--white);border:1px solid var(--quiet)}text{font:14px var(--body)}.node-label{font-weight:700;fill:var(--ink)}.kind,.relation-label,.flow{font:600 11px var(--code);fill:var(--soft)}.relation,.material{fill:none;stroke:var(--blue);stroke-width:2}.relation.inferred,.material.inferred{stroke-dasharray:10 4 2 4}.relation.proposed,.material.proposed{stroke:var(--soft);stroke-dasharray:8 5}.relation.unknown,.material.unknown{stroke:var(--soft);stroke-dasharray:2 5}.family{display:flex;align-items:center;gap:12px;margin-top:24px;color:var(--soft);font:11px var(--code)}.family img{width:112px;height:auto}:focus-visible{outline:3px solid var(--blue);outline-offset:2px}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style></head><body><h1>/m:os | ${esc(m.title)}</h1><p>${esc(m.boundary)} · ${esc(m.purpose)}</p><svg viewBox="0 0 1000 580" role="img" aria-label="System map for ${esc(m.title)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--ink)"/></marker></defs>${material}${edges}${nodes}</svg><p>Solid = observed or reported. Dash-dot = inferred. Dashed = hypothesis. Dotted = unknown. + / − / ? marks causal polarity. Material flows are separate arrows and do not represent causal influence.</p><div class="family"><span>PART OF THE MINDRIAN FAMILY</span><img alt="Mindrian OS" src="${lockup}"></div></body></html>`;
}
export async function runCli(args) {
    const [command, ...rest] = args;
    if (!command || command === "--help" || command === "-h" || command === "help") {
        stdout.write("/m:os stock-flow CLI\nUsage: mos-flow <init|validate|show|import|export> [input] [-o output]\nUse - for stdin/stdout. Import and export validate and round-trip JSON. Export --format svg writes a standalone inline-SVG view.\n");
        return 0;
    }
    const path = rest.find(x => !x.startsWith("-"));
    const out = rest.includes("-o") ? rest[rest.indexOf("-o") + 1] : "-";
    if (command === "init") {
        const json = serializeModel(fixture);
        if (out === "-")
            stdout.write(json);
        else
            await writeFile(out, json, "utf8");
        return 0;
    }
    try {
        const model = parseModel(await input(path));
        if (command === "validate") {
            stdout.write(`Valid /m:os model: ${model.title}\n`);
            return 0;
        }
        if (command === "show") {
            stdout.write(`${model.title}\nBoundary: ${model.boundary}\nPurpose: ${model.purpose}\nStocks: ${model.stocks.length}; material flows: ${model.flows.length}; causal links: ${model.causalLinks.length}\n`);
            return 0;
        }
        if (command === "import" || command === "export") {
            const formatAt = rest.indexOf("--format");
            const svg = formatAt >= 0 && rest[formatAt + 1] === "svg";
            const result = svg ? renderSvg(model) : serializeModel(model);
            if (out === "-")
                stdout.write(result);
            else
                await writeFile(out, result, "utf8");
            return 0;
        }
        stdout.write(`Unknown command: ${command}\n`);
        return 2;
    }
    catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        return 1;
    }
}
