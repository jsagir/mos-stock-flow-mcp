import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("SystemicWorks `/m:os` editor integration", () => {
  const bridge = read("../src/app/mcp-bridge.ts");
  const store = read("../src/app/systemicworks-store.ts");
  const builder = read("../scripts/build-systemicworks.mjs");
  const nodeRenderer = read("../vendor/systemicworks/src/ts/elements/Node.ts");
  const projectRenderer = read("../vendor/systemicworks/src/ts/Model.ts");

  it("imports validated MCP models and draws stock and flow forms", () => {
    expect(bridge).toContain("app.ontoolresult");
    expect(bridge).toContain("host.model.deserialize(toProject(model)");
    expect(bridge).toContain("Stock · ");
    expect(bridge).toContain("@FLOW@");
    expect(nodeRenderer).toContain("startsWith(\"Stock");
    expect(projectRenderer).toContain("@FLOW@ ");
  });

  it("keeps the model locally and supports the JSON handoff", () => {
    expect(store).toContain("getRxStorageDexie()");
    expect(store).toContain("canonicalModels");
    expect(bridge).toContain("saveCanonicalModel(raw)");
    expect(bridge).toContain("mos-open-model-file");
    expect(bridge).toContain("Save /m:os JSON");
  });

  it("packages SystemicWorks as a self-contained MCP App without remote assets", () => {
    expect(builder).toContain("mcp-app.html");
    expect(builder).toContain("googletagmanager");
    expect(builder).toContain("googleapis");
    expect(read("../src/server/tools.ts")).toContain("ui://mos/systemicworks/editor.html");
    expect(read("../package.json")).toContain("dist/app/systemicworks/**");
  });
});
