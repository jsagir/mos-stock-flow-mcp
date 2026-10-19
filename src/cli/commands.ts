import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { parseModel, serializeModel } from "../core/io.js";
import { fixture } from "../core/fixture.js";
import type { Model } from "../core/model.js";
import { renderDiagram } from "../core/diagram.js";
import { findFeedbackLoops } from "../core/loops.js";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function serveLocalApp(port: number): Promise<void> {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../app/systemicworks");
  if (!existsSync(resolve(root, "index.html"))) throw new Error("SystemicWorks app is missing. Reinstall the package or run npm run build.");
  const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".ttf": "font/ttf" };
  const server = createHttpServer((req, res) => {
    const pathname = new URL(req.url ?? "/", `http://127.0.0.1:${port}`).pathname;
    let target = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (pathname.endsWith("/")) target = resolve(target, "index.html");
    if (!existsSync(target)) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "content-type": types[extname(target)] ?? "application/octet-stream", "x-content-type-options": "nosniff", "cache-control": "no-store" });
    createReadStream(target).pipe(res);
  });
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      process.stderr.write(`/m:os SystemicWorks editor: http://127.0.0.1:${port}/\nLocal projects stay in this browser. Press Ctrl+C to stop.\n`);
      resolveListen();
    });
  });
}

async function input(path?: string): Promise<string> {
  if (path && path !== "-") return readFile(path, "utf8");
  let data = ""; for await (const chunk of stdin) data += chunk; return data;
}
export function renderSvg(m: Model): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const diagram = renderDiagram(m);
  const ladder = m.metadata?.abstractionLadder as { concreteCase?: string; crossCasePattern?: string; systemHypothesis?: string; nextEvidence?: string } | undefined;
  const list = (items: string[]) => items.length ? `<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>None recorded.</p>`;
  const flowRows = m.flows.map(flow => {
    const source = flow.fromStockId ? m.stocks.find(stock => stock.id === flow.fromStockId)?.label ?? flow.fromStockId : "outside this map";
    const target = flow.toStockId ? m.stocks.find(stock => stock.id === flow.toStockId)?.label ?? flow.toStockId : "outside this map";
    return `<li><b>${esc(flow.label)}</b><span>${esc(source)} → ${esc(target)}</span><small>${esc(flow.evidence)} · rate ${flow.rate == null ? "unknown" : esc(String(flow.rate))}${flow.unit ? ` ${esc(flow.unit)}` : ""}${flow.delay ? ` · delay: ${esc(flow.delay)}` : ""}</small></li>`;
  });
  const linkRows = m.causalLinks.map(link => {
    const source = [...m.stocks, ...(m.variables ?? []), ...m.actors, ...m.levels].find(node => node.id === link.fromId)?.label ?? link.fromId;
    const target = [...m.stocks, ...(m.variables ?? []), ...m.actors, ...m.levels].find(node => node.id === link.toId)?.label ?? link.toId;
    const polarity = link.polarity === "positive" ? "positive" : link.polarity === "negative" ? "negative" : "unknown";
    const sign = link.polarity === "positive" ? "+" : link.polarity === "negative" ? "−" : "?";
    return `<li><b>${sign} · ${esc(link.evidence)} · ${esc(link.label || `${source} influences ${target}`)}</b><span>${esc(source)} → ${esc(target)} · ${polarity} influence</span><small>${esc(link.evidence)}${link.delay ? ` · delay: ${esc(link.delay)}` : ""}</small></li>`;
  });
  const loopRows = findFeedbackLoops(m).map(loop => {
    const mark = loop.kind === "reinforcing" ? "R · reinforcing" : loop.kind === "balancing" ? "B · balancing" : "? · signs unknown";
    return `<li><b>${mark}</b><span>${esc(loop.label)}</span></li>`;
  });
  const ladderHtml = ladder ? `<section class="ladder" aria-labelledby="ladder-title"><h2 id="ladder-title">From case evidence to a system idea</h2><div class="ladder-steps"><article><h3>Case</h3><p>${esc(ladder.concreteCase || "No concrete case evidence was recorded.")}</p><span class="status reported">Reported</span></article><article><h3>Pattern</h3><p>${esc(ladder.crossCasePattern || "No cross-case pattern has been established.")}</p><span class="status unknown">Not established</span></article><article><h3>Possible system explanation</h3><p>${esc(ladder.systemHypothesis || "No system explanation has been proposed.")}</p><span class="status hypothesis">Hypothesis</span></article></div><p class="next-evidence"><b>What to look for next:</b> ${esc(ladder.nextEvidence || "Compare concrete cases and look for evidence that could disconfirm the explanation.")}</p></section>` : `<section class="ladder"><h2>What this map can and cannot tell you</h2><p>${m.evidence.length ? "The evidence notes below describe the supplied observations or reports." : "No evidence notes were supplied."} The diagram organizes a proposed explanation; it does not prove that its arrows cause the outcomes. Compare concrete cases before treating a repeated pattern or mechanism as established.</p></section>`;
  const evidence = list(m.evidence.map(note => `${note.status}: ${note.text}`));
  const assumptions = list(m.assumptions.map(note => `${note.status}: ${note.text}`));
  const assetRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../app/systemicworks/assets");
  const inline = (name: string, mime: string) => {
    const candidates = [join(assetRoot, name), join(process.cwd(), "dist/app/systemicworks/assets", name)];
    const path = candidates.find(existsSync);
    return path ? `data:${mime};base64,${readFileSync(path).toString("base64")}` : "";
  };
  const figtree = inline("fonts/Figtree-variable.woff2", "font/woff2");
  const dmSans = inline("fonts/DM-Sans-variable.ttf", "font/ttf");
  const lockup = inline("mos-lockup.svg", "image/svg+xml");
  const typography = `@font-face{font-family:Figtree;src:url(${figtree});font-weight:100 900;font-display:swap}@font-face{font-family:"DM Sans";src:url(${dmSans});font-weight:100 900;font-display:swap}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.title)} | /m:os system map</title><style>
:root{color-scheme:light;--paper:#F7F5EE;--surface:#FFFFFF;--ink:#111111;--muted:#4B4943;--line:#D7D4CB;--blue:#1F3FBF;--red:#D6281F;--yellow:#F2C200;--amber:#805600;--soft:#ECEAE2}${typography}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 "DM Sans",Heebo,Arial,sans-serif}header,main,footer{width:min(1180px,calc(100% - 40px));margin-inline:auto}header{padding:28px 0 18px;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:12px;font-size:13px;font-weight:700;color:var(--blue);letter-spacing:.02em}.brand img{width:96px;height:auto}h1{font-family:Figtree,"DM Sans",sans-serif;font-size:clamp(28px,4vw,42px);line-height:1.12;margin:14px 0 10px;max-width:24ch}header p{max-width:72ch;margin:6px 0;color:var(--muted)}main{padding:20px 0 40px}h2{font-size:21px;line-height:1.25;margin:0 0 12px}h3{font-size:17px;margin:0 0 6px}.context{padding:18px 0;border-bottom:1px solid var(--line)}.context p{margin:6px 0;max-width:78ch}.context b{color:var(--muted)}.ladder{padding:22px 0;border-bottom:1px solid var(--line)}.ladder-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.ladder-steps article{padding-top:10px;border-top:2px solid var(--ink)}.ladder-steps p{margin:6px 0 10px;max-width:42ch}.status{display:inline-block;font-size:12px;font-weight:700}.status.reported{color:#285538}.status.unknown{color:#5d5960}.status.hypothesis{color:var(--amber)}.next-evidence{margin:14px 0 0;padding:10px 12px;background:var(--soft);max-width:90ch}.how-to-read{padding:20px 0;border-bottom:1px solid var(--line)}.how-to-read ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;padding-left:22px;margin:0}.how-to-read li{padding-left:4px;max-width:38ch}.diagram-section{padding:24px 0 18px}.diagram-section>p{max-width:72ch;color:var(--muted)}.canvas{overflow:auto;border:1px solid var(--line);background:var(--surface)}svg{display:block;width:100%;height:auto;min-width:1000px;font:14px Arial,sans-serif;overflow:visible}.stock rect,.aux ellipse{fill:#fff;stroke:#171717;stroke-width:2}.node-label{fill:#171717;font-size:16px;font-weight:600}.node-meta,.node-kind{fill:#444;font-size:12px}.flow .pipe-under{fill:none;stroke:#fff;stroke-width:10}.flow .pipe{fill:none;stroke:#171717;stroke-width:2;marker-end:url(#flow-arrow)}.valve{fill:#fff;stroke:#171717;stroke-width:2}.valve-mark{fill:none;stroke:#171717;stroke-width:1.5}.flow-label,.link-label{fill:#171717;font-size:13px}.causal path{fill:none;stroke:#444;stroke-width:1.8;stroke-dasharray:7 4;marker-end:url(#causal-arrow)}.polarity-badge{fill:#fff;stroke:#444;stroke-width:1.2}.polarity{fill:#171717;font-size:14px;font-weight:bold}.clouds path{fill:#fff;stroke:#171717;stroke-width:1.5}.key{display:flex;flex-wrap:wrap;gap:10px 22px;margin:10px 0 0;padding:0;list-style:none;color:var(--muted);font-size:13px}.key b{color:var(--ink)}.explanations{padding:22px 0;border-top:1px solid var(--line)}.explanations>p{max-width:74ch;color:var(--muted)}.entity-list{padding:0;list-style:none;border-top:1px solid var(--line)}.entity-list li{display:grid;grid-template-columns:minmax(190px,1fr) minmax(220px,1.25fr) minmax(150px,.8fr);gap:14px;padding:12px 0;border-bottom:1px solid var(--line);align-items:start}.entity-list small{color:var(--muted)}.notes{padding:18px 0;border-top:1px solid var(--line)}.notes ul{padding-left:20px;max-width:90ch}.notes li{margin:7px 0}footer{padding:14px 0 30px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}@media(max-width:700px){header,main,footer{width:calc(100% - 28px)}.ladder-steps,.how-to-read ol{grid-template-columns:1fr;gap:14px}.entity-list li{grid-template-columns:1fr;gap:3px}.canvas svg{min-width:920px}}
</style></head><body><header><div class="brand"><img src="${lockup}" alt="/m:os"> STOCK AND FLOW MAP</div><h1>${esc(m.title)}</h1><p>${esc(m.purpose)}</p></header><main><section class="context"><p><b>System boundary:</b> ${esc(m.boundary)}</p><p><b>Time covered:</b> ${esc(m.timeHorizon || "Not specified")}</p></section>${ladderHtml}<section class="how-to-read"><h2>How to read this map</h2><ol><li><b>Boxes are stocks:</b> amounts that build up or run down over time.</li><li><b>Pipe arrows are flows:</b> what enters, leaves, or moves between stocks. A valve marks the rate of change.</li><li><b>Dashed arrows are influences:</b> a proposed relationship that may change a flow. “+” means both move in the same direction; “−” means they move in opposite directions.</li></ol><ul class="key"><li><b>Solid pipe</b> stock changes</li><li><b>Dashed arrow</b> possible influence</li><li><b>+ / − / ?</b> influence direction</li><li><b>Evidence status</b> appears in the descriptions below</li></ul></section><section class="diagram-section"><h2>System map</h2><p>Read left to right: follow what accumulates, then trace the flows that change it. Use the descriptions below when an arrow label is unclear.</p><div class="canvas"><svg viewBox="${diagram.viewBox}" role="img" aria-label="Stock and flow map: ${esc(m.title)}">${diagram.markup}</svg></div></section><section class="explanations"><h2>What each flow means</h2><p>Each line names the source, destination, evidence status, and any known rate or delay.</p><ul class="entity-list">${flowRows.length ? flowRows.join("") : "<li>No material flows are mapped.</li>"}</ul></section><section class="explanations"><h2>Influence hypotheses</h2><p>These dashed arrows are claims to examine. Their direction alone does not establish cause.</p><ul class="entity-list">${linkRows.length ? linkRows.join("") : "<li>No causal influences are mapped.</li>"}</ul></section><section class="explanations"><h2>Feedback loops</h2><p>R loops reinforce; B loops balance. The label follows the mapped arrow signs and does not establish real-world causation.</p><ul class="entity-list">${loopRows.length ? loopRows.join("") : "<li>No closed causal loops are mapped.</li>"}</ul></section><section class="notes"><h2>Evidence recorded</h2>${evidence}</section><section class="notes"><h2>Assumptions to keep in view</h2>${assumptions}</section></main><footer>Created with /m:os · Quantities left unknown remain unknown.</footer></body></html>`;
}
export async function runCli(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  if (!command || command === "--help" || command === "-h" || command === "help") { stdout.write("/m:os systems CLI\nUsage: mos-flow <app|init|validate|show|import|export> [input] [-o output]\n  app [--port 4173]  Open the local-first SystemicWorks editor on this device.\nUse - for stdin/stdout. Import and export validate and round-trip JSON. Export --format svg writes a standalone inline-SVG view.\n"); return 0; }
  if (command === "app") {
    const portAt = rest.indexOf("--port");
    const port = portAt >= 0 ? Number(rest[portAt + 1]) : Number(process.env.MOS_APP_PORT ?? 4173);
    if (!Number.isInteger(port) || port < 1 || port > 65535) { process.stderr.write("Port must be an integer between 1 and 65535.\n"); return 2; }
    try { await serveLocalApp(port); return 0; } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); return 1; }
  }
  const path = rest.find(x => !x.startsWith("-")); const out = rest.includes("-o") ? rest[rest.indexOf("-o") + 1] : "-";
  if (command === "init") { const json = serializeModel(fixture); if (out === "-") stdout.write(json); else await writeFile(out, json, "utf8"); return 0; }
  try {
    const model = parseModel(await input(path));
    if (command === "validate") { stdout.write(`Valid /m:os model: ${model.title}\n`); return 0; }
    if (command === "show") {
      const loops = findFeedbackLoops(model);
      stdout.write(`${model.title}\nBoundary: ${model.boundary}\nPurpose: ${model.purpose}\nStocks: ${model.stocks.length}; causal variables: ${(model.variables ?? []).length}; material flows: ${model.flows.length}; causal links: ${model.causalLinks.length}; feedback loops: ${loops.length}${loops.length === 32 ? "+ (display capped)" : ""}\n`);
      for (const loop of loops) stdout.write(`  ${loop.kind === "reinforcing" ? "R" : loop.kind === "balancing" ? "B" : "?"} ${loop.label}\n`);
      return 0;
    }
    if (command === "import" || command === "export") {
      const formatAt = rest.indexOf("--format"); const svg = formatAt >= 0 && rest[formatAt + 1] === "svg";
      const result = svg ? renderSvg(model) : serializeModel(model);
      if (out === "-") stdout.write(result); else await writeFile(out, result, "utf8"); return 0;
    }
    stdout.write(`Unknown command: ${command}\n`); return 2;
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); return 1; }
}
