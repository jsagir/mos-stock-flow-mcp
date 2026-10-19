import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { fixture } from "../dist/core/fixture.js";
const child = spawn(process.execPath, ["dist/server/http.js"], { env: { ...process.env, PORT: "4317" }, stdio: "ignore" });
try { let response; for (let i = 0; i < 30; i++) { try { response = await fetch("http://127.0.0.1:4317/health"); break; } catch { await delay(100); } }
  if (!response?.ok || !(await response.text()).includes("/m:os")) throw new Error("local deployment health check failed");
  const client = new Client({ name: "mos-http-smoke", version: "0.1.0" }, { capabilities: {} });
  await client.connect(new StreamableHTTPClientTransport(new URL("http://127.0.0.1:4317/mcp")));
  const tools = await client.listTools(); if (!tools.tools.some(t => t.name === "model_validate")) throw new Error("HTTP MCP tools/list missing model_validate");
  const result = await client.callTool({ name: "model_validate", arguments: { model: JSON.stringify(fixture) } });
  if (result.isError || !JSON.stringify(result).includes("Valid")) throw new Error("HTTP MCP tools/call failed");
  await client.close();
  process.stdout.write("Local deploy smoke passed: /health and stateless HTTP MCP initialize/list/call.\n");
} finally { child.kill("SIGTERM"); }
