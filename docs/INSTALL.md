# Install `/m:os`

## Local one-command install

Download or clone the project, open its directory, and run `./install.sh`. It requires Node.js 20+ and npm, installs pinned dependencies, builds, links `mos-flow`, and writes `.mcp.json`. Review that file and copy its `mcpServers.mos-systems` entry into your MCP client settings. The script does not edit client settings because paths and config formats differ.

After setup, run `mos-flow init -o example.json`, `mos-flow validate example.json`, or `mos-flow export example.json --format svg -o example.html`. For local MCP use `node /absolute/path/to/dist/server/stdio.js`. Text and structured JSON work in non-App clients; App rendering requires MCP Apps support.

## Hosted connector

For the shared service, add `https://mos-stock-flow-mcp.vercel.app/mcp` in your AI client's remote MCP connector settings. This service is already deployed and is free to use. You do not need to create an account with the hosting provider or deploy an instance.

To operate a separate instance in your own account, use the [Render one-click deploy](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp). Once it is ready, connect its `/mcp` URL. Client setup screens differ, so there is no universal client-side command.

## npm install

Install both the CLI and local stdio MCP launcher:

```sh
npm install --global @jsagir/mos-stock-flow-mcp
```

Use `mos-flow` for CLI commands and `mos-mcp` as the command for a local MCP server configuration. The hosted service above requires no npm install.
