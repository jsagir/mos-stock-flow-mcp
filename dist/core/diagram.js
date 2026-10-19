const esc = (s) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const evidenceClass = (e) => e === "observed" || e === "reported" ? "solid" : e === "inferred" ? "inferred" : e === "hypothesis" ? "hypothesis" : "unknown";
/** Conventional system-dynamics notation: stocks are boxes, material flows are pipes with valves, influences are dashed arrows. */
export function renderDiagram(model, simulatedValues) {
    const all = [...model.stocks, ...(model.variables ?? []), ...model.actors, ...model.levels];
    const points = new Map(all.map((n, i) => [n.id, model.layout.nodes[n.id] ?? { x: 100 + (i % 3) * 340, y: 100 + Math.floor(i / 3) * 240 }]));
    const size = (id) => model.stocks.some(s => s.id === id) || model.variables?.some(v => v.id === id) ? { w: 220, h: 94 } : { w: 190, h: 72 };
    const p = (id) => points.get(id) ?? { x: 100, y: 100 };
    const minX = Math.min(0, ...all.map(n => p(n.id).x - 220));
    const minY = Math.min(0, ...all.map(n => p(n.id).y - 80));
    const maxX = Math.max(900, ...all.map(n => p(n.id).x + size(n.id).w + 180));
    const maxY = Math.max(520, ...all.map(n => p(n.id).y + size(n.id).h + 150));
    const labelBoxes = [];
    const nodes = all.map(n => {
        const q = p(n.id), stock = model.stocks.find(s => s.id === n.id), variable = model.variables?.find(v => v.id === n.id), kind = stock ? "STOCK" : variable ? "VARIABLE" : model.actors.some(a => a.id === n.id) ? "ACTOR" : "LEVEL";
        const w = size(n.id).w, h = size(n.id).h;
        if (stock) {
            const value = simulatedValues?.[stock.id] ?? stock.value;
            return `<g class="stock node" data-node-id="${esc(n.id)}" tabindex="0" role="button" aria-label="Stock: ${esc(n.label)}"><rect x="${q.x}" y="${q.y}" width="${w}" height="${h}"/><text class="node-label" x="${q.x + 12}" y="${q.y + 32}">${esc(n.label)}</text><text class="node-meta" x="${q.x + 12}" y="${q.y + 66}">${esc([value ?? "", stock.unit ?? ""].filter(Boolean).join(" ") || "value unknown")}</text></g>`;
        }
        const meta = variable ? [variable.value ?? "", variable.unit ?? ""].filter(Boolean).join(" ") || "value unknown" : "";
        return `<g class="aux node ${variable ? "variable" : ""}" data-node-id="${esc(n.id)}" tabindex="0" role="button" aria-label="${kind}: ${esc(n.label)}"><ellipse cx="${q.x + w / 2}" cy="${q.y + h / 2}" rx="${w / 2}" ry="${h / 2}"/><text class="node-kind" x="${q.x + w / 2}" y="${q.y + (variable ? 21 : 25)}" text-anchor="middle">${kind}</text><text class="node-label" x="${q.x + w / 2}" y="${q.y + (variable ? 43 : 48)}" text-anchor="middle">${esc(n.label)}</text>${variable ? `<text class="node-meta" x="${q.x + w / 2}" y="${q.y + 64}" text-anchor="middle">${esc(meta)}</text>` : ""}</g>`;
    }).join("");
    const clouds = new Set();
    const flows = model.flows.map((f, i) => {
        const from = f.fromStockId ? p(f.fromStockId) : null, to = f.toStockId ? p(f.toStockId) : null;
        const fromSize = f.fromStockId ? size(f.fromStockId) : null, toSize = f.toStockId ? size(f.toStockId) : null;
        const portY = (id) => {
            const related = model.flows.filter(flow => flow.fromStockId === id || flow.toStockId === id);
            const rank = related.findIndex(flow => flow.id === f.id);
            const offset = related.length < 2 ? 0 : -30 + 60 * rank / (related.length - 1);
            return p(id).y + size(id).h / 2 + offset;
        };
        const rightward = !from || !to || to.x >= from.x;
        const vertical = Boolean(from && to && Math.abs(to.y - from.y) > Math.abs(to.x - from.x));
        let sx, sy, ex, ey, routeX, routeY, d, labelX, labelY, labelAnchor;
        if (vertical && from && to) {
            const down = to.y >= from.y;
            sx = from.x + fromSize.w / 2;
            ex = to.x + toSize.w / 2;
            sy = down ? from.y + fromSize.h : from.y;
            ey = down ? to.y : to.y + toSize.h;
            routeY = (sy + ey) / 2;
            routeX = (sx + ex) / 2;
            d = `M${sx},${sy} V${routeY} H${ex} V${ey}`;
            labelX = Math.max(sx, ex) + 18;
            labelY = routeY - 5;
            labelAnchor = "start";
        }
        else {
            sy = from ? portY(f.fromStockId) : to ? portY(f.toStockId) : 100;
            ey = to ? portY(f.toStockId) : sy;
            sx = from ? from.x + (rightward ? fromSize.w : 0) : (to?.x ?? 260) - 140;
            ex = to ? to.x + (rightward ? 0 : toSize.w) : (from?.x ?? 100) + fromSize.w + 140;
            routeX = (sx + ex) / 2;
            routeY = sy;
            d = `M${sx},${sy} H${routeX} V${ey} H${ex}`;
            labelX = routeX;
            labelY = Math.min(sy, ey) - 16;
            labelAnchor = "middle";
        }
        if (!from)
            clouds.add(`M${sx - 35},${sy} c-18,-16 8,-33 23,-24 c9,-24 42,-12 38,7 c22,3 17,28 -2,28 h-44 c-10,0 -17,-5 -15,-11 Z`);
        if (!to)
            clouds.add(`M${ex - 18},${ey} c-18,-16 8,-33 23,-24 c9,-24 42,-12 38,7 c22,3 17,28 -2,28 h-44 c-10,0 -17,-5 -15,-11 Z`);
        const words = `${f.label}${f.rate != null ? ` · ${f.rate}${f.unit ? ` ${f.unit}` : ""}` : ""}`.split(/\s+/);
        const maxChars = Math.max(9, Math.floor(((vertical ? maxX - Math.max(sx, ex) - 40 : Math.abs(ex - sx)) - 20) / 7));
        const rows = [];
        let row = "";
        for (const word of words) {
            if (row && row.length + word.length + 1 > maxChars) {
                rows.push(row);
                row = word;
            }
            else
                row += `${row ? " " : ""}${word}`;
        }
        if (row)
            rows.push(row);
        const labelTop = labelY - (rows.length - 1) * 13;
        const flowLabelWidth = Math.max(36, Math.min(240, Math.max(...rows.map(line => line.length)) * 7));
        labelBoxes.push({ x: labelAnchor === "start" ? labelX : labelX - flowLabelWidth / 2, y: labelTop - 14, w: flowLabelWidth, h: rows.length * 14 });
        const label = `<text class="flow-label" x="${labelX}" y="${labelTop}" text-anchor="${labelAnchor}">${rows.map((line, j) => `<tspan x="${labelX}" dy="${j ? 13 : 0}">${esc(line)}</tspan>`).join("")}</text>`;
        return `<g class="flow ${evidenceClass(f.evidence)}" data-flow-id="${esc(f.id)}" tabindex="0" role="button" aria-label="Flow: ${esc(f.label)}"><path d="${d}" class="pipe-under"/><path d="${d}" class="pipe" marker-end="url(#flow-arrow)"/><circle class="valve" cx="${routeX}" cy="${routeY}" r="12"/><path class="valve-mark" d="M${routeX - 7},${routeY - 7} L${routeX},${routeY} L${routeX - 7},${routeY + 7} M${routeX + 7},${routeY - 7} L${routeX},${routeY} L${routeX + 7},${routeY + 7}"/>${label}</g>`;
    }).join("");
    const links = model.causalLinks.map(link => {
        const a = p(link.fromId), b = p(link.toId), as = size(link.fromId), bs = size(link.toId);
        const acx = a.x + as.w / 2, acy = a.y + as.h / 2, bcx = b.x + bs.w / 2, bcy = b.y + bs.h / 2;
        const vertical = Math.abs(bcy - acy) > Math.abs(bcx - acx);
        const x1 = vertical ? acx : acx + (bcx >= acx ? as.w / 2 : -as.w / 2);
        const y1 = vertical ? acy + (bcy >= acy ? as.h / 2 : -as.h / 2) : acy;
        const x2 = vertical ? bcx : bcx + (bcx >= acx ? -bs.w / 2 : bs.w / 2);
        const y2 = vertical ? bcy + (bcy >= acy ? -bs.h / 2 : bs.h / 2) : bcy;
        const mx = (x1 + x2) / 2, my = vertical ? (y1 + y2) / 2 : Math.min(y1, y2) - Math.max(48, Math.abs(x2 - x1) * 0.18);
        const pol = link.polarity === "positive" ? "+" : link.polarity === "negative" ? "−" : "?";
        let labelY = my - 15;
        if (link.label) {
            const width = Math.max(42, Math.min(280, link.label.length * 7));
            const overlaps = (y) => labelBoxes.some(box => mx + width / 2 > box.x && mx - width / 2 < box.x + box.w && y > box.y - 14 && y - 14 < box.y + box.h);
            for (let attempt = 0; attempt < 12 && overlaps(labelY); attempt++)
                labelY += attempt % 2 === 0 ? -22 * (attempt / 2 + 1) : 22 * ((attempt + 1) / 2);
            labelBoxes.push({ x: mx - width / 2, y: labelY - 14, w: width, h: 16 });
        }
        return `<g class="causal ${evidenceClass(link.evidence)}" data-link-id="${esc(link.id)}" tabindex="0" role="button" aria-label="Influence: ${esc(link.label || link.id)}"><path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" marker-end="url(#causal-arrow)"/><circle cx="${mx}" cy="${my}" r="12" class="polarity-badge"/><text x="${mx}" y="${my + 5}" text-anchor="middle" class="polarity">${pol}</text>${link.label ? `<text x="${mx}" y="${labelY}" text-anchor="middle" class="link-label">${esc(link.label)}</text>` : ""}</g>`;
    }).join("");
    return { viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`, width: maxX - minX, height: maxY - minY, markup: `<defs><marker id="flow-arrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z"/></marker><marker id="causal-arrow" markerWidth="9" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z"/></marker></defs><g class="clouds">${[...clouds].map(d => `<path d="${d}"/>`).join("")}</g>${flows}${links}${nodes}` };
}
