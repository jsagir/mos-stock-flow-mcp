const esc = (s) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const evidenceClass = (e) => e === "observed" || e === "reported" ? "solid" : e === "inferred" ? "inferred" : e === "hypothesis" ? "hypothesis" : "unknown";
/** Conventional system-dynamics notation: stocks are boxes, material flows are pipes with valves, influences are dashed arrows. */
export function renderDiagram(model) {
    const all = [...model.stocks, ...model.actors, ...model.levels];
    const points = new Map(all.map((n, i) => [n.id, model.layout.nodes[n.id] ?? { x: 100 + (i % 3) * 340, y: 100 + Math.floor(i / 3) * 240 }]));
    const size = (id) => model.stocks.some(s => s.id === id) ? { w: 220, h: 94 } : { w: 190, h: 72 };
    const p = (id) => points.get(id) ?? { x: 100, y: 100 };
    const minX = Math.min(0, ...all.map(n => p(n.id).x - 220));
    const minY = Math.min(0, ...all.map(n => p(n.id).y - 80));
    const maxX = Math.max(900, ...all.map(n => p(n.id).x + size(n.id).w + 180));
    const maxY = Math.max(520, ...all.map(n => p(n.id).y + size(n.id).h + 150));
    const nodes = all.map(n => {
        const q = p(n.id), stock = model.stocks.find(s => s.id === n.id), kind = stock ? "STOCK" : model.actors.some(a => a.id === n.id) ? "ACTOR" : "LEVEL";
        const w = size(n.id).w, h = size(n.id).h;
        if (stock)
            return `<g class="stock"><rect x="${q.x}" y="${q.y}" width="${w}" height="${h}"/><text class="node-label" x="${q.x + 12}" y="${q.y + 32}">${esc(n.label)}</text><text class="node-meta" x="${q.x + 12}" y="${q.y + 66}">${esc([stock.value ?? "", stock.unit ?? ""].filter(Boolean).join(" ") || "value unknown")}</text></g>`;
        return `<g class="aux"><ellipse cx="${q.x + w / 2}" cy="${q.y + h / 2}" rx="${w / 2}" ry="${h / 2}"/><text class="node-kind" x="${q.x + w / 2}" y="${q.y + 25}" text-anchor="middle">${kind}</text><text class="node-label" x="${q.x + w / 2}" y="${q.y + 48}" text-anchor="middle">${esc(n.label)}</text></g>`;
    }).join("");
    const clouds = new Set();
    const flows = model.flows.map((f, i) => {
        const from = f.fromStockId ? p(f.fromStockId) : null, to = f.toStockId ? p(f.toStockId) : null;
        const fromSize = f.fromStockId ? size(f.fromStockId) : null, toSize = f.toStockId ? size(f.toStockId) : null;
        const y1 = from ? from.y + fromSize.h / 2 : (to?.y ?? 100) + 30 + (i % 3) * 16;
        const y2 = to ? to.y + toSize.h / 2 : y1;
        const rightward = !from || !to || to.x >= from.x;
        const sx = from ? from.x + (rightward ? fromSize.w : 0) : (to?.x ?? 260) - 140;
        const ex = to ? to.x + (rightward ? 0 : toSize.w) : (from?.x ?? 100) + fromSize.w + 140;
        const d = `M${sx},${y1} H${(sx + ex) / 2} V${y2} H${ex}`;
        if (!from)
            clouds.add(`M${sx - 35},${y1} c-18,-16 8,-33 23,-24 c9,-24 42,-12 38,7 c22,3 17,28 -2,28 h-44 c-10,0 -17,-5 -15,-11 Z`);
        if (!to)
            clouds.add(`M${ex - 18},${y2} c-18,-16 8,-33 23,-24 c9,-24 42,-12 38,7 c22,3 17,28 -2,28 h-44 c-10,0 -17,-5 -15,-11 Z`);
        const mid = (sx + ex) / 2;
        return `<g class="flow ${evidenceClass(f.evidence)}"><path d="${d}" class="pipe-under"/><path d="${d}" class="pipe" marker-end="url(#flow-arrow)"/><circle class="valve" cx="${mid}" cy="${y1}" r="12"/><path class="valve-mark" d="M${mid - 7},${y1 - 7} L${mid},${y1} L${mid - 7},${y1 + 7} M${mid + 7},${y1 - 7} L${mid},${y1} L${mid + 7},${y1 + 7}"/><text class="flow-label" x="${mid}" y="${Math.min(y1, y2) - 16}" text-anchor="middle">${esc(f.label)}${f.rate != null ? ` · ${esc(String(f.rate))}` : ""}${f.unit ? ` ${esc(f.unit)}` : ""}</text></g>`;
    }).join("");
    const links = model.causalLinks.map(link => {
        const a = p(link.fromId), b = p(link.toId), as = size(link.fromId), bs = size(link.toId);
        const x1 = a.x + as.w / 2, y1 = a.y, x2 = b.x + bs.w / 2, y2 = b.y;
        const lift = Math.max(48, Math.abs(x2 - x1) * 0.18), mx = (x1 + x2) / 2, my = Math.min(y1, y2) - lift;
        const pol = link.polarity === "positive" ? "+" : link.polarity === "negative" ? "−" : "?";
        return `<g class="causal ${evidenceClass(link.evidence)}"><path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" marker-end="url(#causal-arrow)"/><circle cx="${mx}" cy="${my}" r="12" class="polarity-badge"/><text x="${mx}" y="${my + 5}" text-anchor="middle" class="polarity">${pol}</text>${link.label ? `<text x="${mx}" y="${my - 15}" text-anchor="middle" class="link-label">${esc(link.label)}</text>` : ""}</g>`;
    }).join("");
    return { viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`, width: maxX - minX, height: maxY - minY, markup: `<defs><marker id="flow-arrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z"/></marker><marker id="causal-arrow" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z"/></marker></defs><g class="clouds">${[...clouds].map(d => `<path d="${d}"/>`).join("")}</g>${flows}${links}${nodes}` };
}
