import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { parseModel, serializeModel } from "../core/io.js";
import { fixture } from "../core/fixture.js";
import { renderDiagram } from "../core/diagram.js";
async function input(path) {
    if (path && path !== "-")
        return readFile(path, "utf8");
    let data = "";
    for await (const chunk of stdin)
        data += chunk;
    return data;
}
export function renderSvg(m) {
    const esc = (s) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const diagram = renderDiagram(m);
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(m.title)} | Stock and flow diagram</title><style>body{margin:0;padding:24px;color:#171717;background:#fff;font:16px/1.5 Arial,sans-serif}h1{margin:0 0 8px;font-size:25px}header{max-width:1400px;margin:0 auto 20px}header p{margin:4px 0;color:#444}.canvas{max-width:1400px;margin:auto;overflow:auto;border:1px solid #aaa;background:#fff}svg{display:block;width:100%;height:auto;min-width:900px;font:14px Arial,sans-serif;overflow:visible}.stock rect,.aux ellipse{fill:#fff;stroke:#171717;stroke-width:2}.node-label{fill:#171717;font-size:16px;font-weight:600}.node-meta,.node-kind{fill:#444;font-size:12px}.flow .pipe-under{fill:none;stroke:#fff;stroke-width:10}.flow .pipe{fill:none;stroke:#171717;stroke-width:2;marker-end:url(#flow-arrow)}.valve{fill:#fff;stroke:#171717;stroke-width:2}.valve-mark{fill:none;stroke:#171717;stroke-width:1.5}.flow-label,.link-label{fill:#171717;font-size:13px}.causal path{fill:none;stroke:#444;stroke-width:1.6;stroke-dasharray:6 4;marker-end:url(#causal-arrow)}.polarity-badge{fill:#fff;stroke:#444;stroke-width:1.2}.polarity{fill:#171717;font-size:14px;font-weight:bold}.clouds path{fill:#fff;stroke:#171717;stroke-width:1.5}.flow.inferred .pipe,.causal.inferred path{stroke-dasharray:8 3 2 3}.flow.hypothesis .pipe,.causal.hypothesis path{stroke-dasharray:7 4}.flow.unknown .pipe,.causal.unknown path{stroke-dasharray:2 4}.legend{max-width:1400px;margin:14px auto;color:#444;font-size:13px}</style></head><body><header><h1>${esc(m.title)}</h1><p><b>Boundary:</b> ${esc(m.boundary)}</p><p><b>Purpose:</b> ${esc(m.purpose)}</p></header><div class="canvas"><svg viewBox="${diagram.viewBox}" role="img" aria-label="Stock and flow diagram for ${esc(m.title)}">${diagram.markup}</svg></div><p class="legend">Rectangles are stocks; pipes and valves are material flows; dashed arrows are causal influences. + / − / ? marks influence polarity. Evidence status is shown by the line pattern.</p></body></html>`;
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
