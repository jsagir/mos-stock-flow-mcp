import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [join(here, "../app/systemicworks/mcp-app.html"), join(process.cwd(), "dist/app/systemicworks/mcp-app.html")];
const resourcePath = candidates.find(existsSync);
if (!resourcePath) throw new Error("SystemicWorks MCP App is missing. Run npm run build before starting the MCP server.");
export const appHtml = readFileSync(resourcePath, "utf8");
