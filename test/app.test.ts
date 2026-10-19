import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("M:OS App source", () => {
  const html = readFileSync(new URL("../src/app/index.html", import.meta.url), "utf8"); const css = readFileSync(new URL("../src/app/styles.css", import.meta.url), "utf8");
  it("uses the sourced family palette and bundled typography", () => { expect(html).toContain('data-theme="light"'); expect(html).toContain("__MOS_CSS__"); for (const color of ["#F7F5EE", "#FFFFFF", "#111111", "#4B4943", "#1F3FBF", "#D6281F", "#F2C200", "#ECEAE2"]) expect(css).toContain(color); expect(css).toContain("Figtree"); expect(css).toContain('"JetBrains Mono"'); const builder = readFileSync(new URL("../scripts/copy-app.mjs", import.meta.url), "utf8"); expect(builder).toContain('font-family:"DM Sans"'); expect(builder).toContain('font-family:"JetBrains Mono"'); });
  it("provides keyboard focus and reduced-motion support", () => { expect(css).toContain(":focus-visible"); expect(css).toContain("prefers-reduced-motion"); });
  it("hands the initiating MCP model to the view and provides causal text", () => { const main = readFileSync(new URL("../src/app/main.ts", import.meta.url), "utf8"); expect(main).toContain("app.ontoolinput"); expect(main).toContain("app.ontoolresult"); expect(main).toContain("validateModel(value)"); expect(html).toContain('id="relationships"'); expect(main).toContain("source, destination, polarity, evidence status, and delay"); });
});
