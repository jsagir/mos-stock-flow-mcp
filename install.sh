#!/bin/sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js 20 or newer is required." >&2; exit 1; }
node -e 'if(Number(process.versions.node.split(".")[0])<20)process.exit(1)' || { echo "Node.js 20 or newer is required." >&2; exit 1; }
npm install
npm run build
npm link
node scripts/write-mcp-config.mjs
printf 'Installed /m:os CLI as mos-flow. Local MCP config: %s/.mcp.json\n' "$PWD"
printf 'Review and copy that MCP entry into a client that supports local stdio MCP.\n'
