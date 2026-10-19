import { modelSchema } from "./schema.js";
export function validateModel(input) {
    const result = modelSchema.safeParse(input);
    if (!result.success)
        return { ok: false, issues: result.error.issues.map(i => ({ path: i.path.join("."), message: i.message })) };
    const model = result.data;
    const issues = [];
    const all = [...model.actors, ...model.levels, ...model.stocks, ...model.flows, ...model.causalLinks, ...model.assumptions, ...model.evidence];
    const ids = new Set();
    for (const item of all) {
        if (ids.has(item.id))
            issues.push({ path: item.id, message: "IDs must be unique across the model." });
        ids.add(item.id);
    }
    const levels = new Set(model.levels.map(x => x.id));
    const stocks = new Set(model.stocks.map(x => x.id));
    const causalNodes = new Set([...model.stocks.map(x => x.id), ...model.actors.map(x => x.id), ...model.levels.map(x => x.id)]);
    model.levels.forEach(x => { if (x.parentId && !levels.has(x.parentId))
        issues.push({ path: `levels.${x.id}.parentId`, message: "Parent level does not exist." }); if (x.parentId === x.id)
        issues.push({ path: `levels.${x.id}.parentId`, message: "A level cannot contain itself." }); });
    const levelById = new Map(model.levels.map(level => [level.id, level]));
    const complete = new Set();
    for (const level of model.levels) {
        const chain = new Set();
        let current = level;
        while (current?.parentId && levelById.has(current.parentId)) {
            if (chain.has(current.id)) {
                issues.push({ path: `levels.${current.id}.parentId`, message: "Nested level containment must not contain a cycle." });
                break;
            }
            if (complete.has(current.id))
                break;
            chain.add(current.id);
            current = levelById.get(current.parentId);
        }
        for (const id of chain)
            complete.add(id);
    }
    model.stocks.forEach(x => { if (x.levelId && !levels.has(x.levelId))
        issues.push({ path: `stocks.${x.id}.levelId`, message: "Level does not exist." }); });
    model.flows.forEach(x => { if (x.fromStockId && !stocks.has(x.fromStockId))
        issues.push({ path: `flows.${x.id}.fromStockId`, message: "Source stock does not exist." }); if (x.toStockId && !stocks.has(x.toStockId))
        issues.push({ path: `flows.${x.id}.toStockId`, message: "Destination stock does not exist." }); if (!x.fromStockId && !x.toStockId)
        issues.push({ path: `flows.${x.id}`, message: "A material flow must connect to at least one stock." }); });
    model.causalLinks.forEach(x => { if (!causalNodes.has(x.fromId))
        issues.push({ path: `causalLinks.${x.id}.fromId`, message: "Causal source does not exist." }); if (!causalNodes.has(x.toId))
        issues.push({ path: `causalLinks.${x.id}.toId`, message: "Causal destination does not exist." }); });
    for (const nodeId of Object.keys(model.layout.nodes))
        if (!causalNodes.has(nodeId))
            issues.push({ path: `layout.nodes.${nodeId}`, message: "Layout node does not exist." });
    return issues.length ? { ok: false, issues } : { ok: true, model };
}
