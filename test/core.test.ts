import { describe, expect, it } from "vitest";
import { fixture } from "../src/core/fixture.js";
import { parseModel, serializeModel } from "../src/core/io.js";
import { validateModel } from "../src/core/validate.js";
describe("/m:os model contract", () => {
  it("round-trips unknown nullable values", () => { const model = parseModel(serializeModel(fixture)); expect(model).toEqual(fixture); expect(model.stocks[0]?.value).toBeNull(); });
  it("distinguishes dangling stock and causal references", () => { const result = validateModel({ ...fixture, flows: [{ ...fixture.flows[0]!, toStockId: "missing" }] }); expect(result.ok).toBe(false); if (!result.ok) expect(result.issues[0]?.path).toContain("toStockId"); });
  it("rejects duplicate IDs, future versions and invalid units", () => { expect(validateModel({ ...fixture, schemaVersion: "2.0" }).ok).toBe(false); expect(validateModel({ ...fixture, flows: [{ ...fixture.flows[0]!, unit: 9 }] }).ok).toBe(false); expect(validateModel({ ...fixture, assumptions: [{ id: fixture.stocks[0]!.id, text: "duplicate", status: "unknown" }] }).ok).toBe(false); });
  it("caps oversized JSON", () => { expect(() => parseModel(" ".repeat(1_000_001))).toThrow(/exceeds/); });
  it("rejects indirect nesting cycles", () => {
    const levels = [{ id: "a", label: "A", parentId: "b" }, { id: "b", label: "B", parentId: "a" }];
    const result = validateModel({ ...fixture, levels, layout: { ...fixture.layout, nodes: { ...fixture.layout.nodes, a: { x: 1, y: 1 }, b: { x: 2, y: 2 } } } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.some(issue => issue.message.includes("cycle"))).toBe(true);
  });
});
