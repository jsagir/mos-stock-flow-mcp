import { readFile } from "node:fs/promises";
const files = ["README.md", "docs/INSTALL.md", "docs/PRIVACY.md", "docs/DEPLOYMENT.md", "docs/METHOD.md", "docs/BRAND.md", "skills/mos-stock-flow/SKILL.md"];
for (const file of files) { const s = await readFile(file, "utf8"); if (!s.includes("/m:os")) throw new Error(`${file} misses exact /m:os branding`); if (s.includes(String.fromCharCode(0x2014))) throw new Error(`${file} contains a prohibited em dash`); }
const skill = await readFile("skills/mos-stock-flow/SKILL.md", "utf8");
for (const tool of ["model_create", "model_update", "model_validate", "model_export"]) if (!skill.includes(tool)) throw new Error(`Skill references missing tool ${tool}`);
process.stdout.write("Docs check passed.\n");
