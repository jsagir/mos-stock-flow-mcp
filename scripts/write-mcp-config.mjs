import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const configPath = resolve(".mcp.json");
let config = {};
if (existsSync(configPath)) {
  try { config = JSON.parse(readFileSync(configPath, "utf8")); }
  catch { throw new Error(`Refusing to replace invalid JSON in ${configPath}. Fix or back it up, then rerun install.`); }
}
if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error(`Refusing to replace non-object MCP config at ${configPath}.`);
if (config.mcpServers !== undefined && (!config.mcpServers || typeof config.mcpServers !== "object" || Array.isArray(config.mcpServers))) throw new Error(`Refusing to replace invalid mcpServers in ${configPath}.`);
const servers = config.mcpServers ?? {};
if (Object.hasOwn(servers, "mos-systems")) throw new Error(`An MCP server named mos-systems already exists in ${configPath}; remove or rename that entry before installing.`);
servers["mos-systems"] = { command: "node", args: [resolve("dist/server/stdio.js")] };
config.mcpServers = servers;
const temp = `${configPath}.${randomBytes(6).toString("hex")}.tmp`;
writeFileSync(temp, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx", mode: 0o600 });
renameSync(temp, configPath);
process.stdout.write(`Merged mos-systems into ${configPath}\n`);
