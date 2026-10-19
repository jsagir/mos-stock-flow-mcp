# Install `/m:os`

## Local one-command install

Download or clone the project, open its directory, and run `./install.sh`. It requires Node.js 20+ and npm, installs pinned dependencies, builds, links `mos-flow`, and writes `.mcp.json`. Review that file and copy its `mcpServers.mos-systems` entry into your MCP client settings. The script does not edit client settings because paths and config formats differ.

After setup, run `mos-flow app` to start the local-first SystemicWorks editor, or use `mos-flow init -o example.json`, `mos-flow validate example.json`, and `mos-flow export example.json --format svg -o example.html`. For local MCP use `node /absolute/path/to/dist/server/stdio.js`. The bundled editor renders in hosts that support MCP Apps.

## Hosted connector

For the shared service, add `https://mos-stock-flow-mcp.vercel.app/mcp` in your AI client's remote MCP connector settings. This service is already deployed and is free to use. You do not need to create an account with the hosting provider or deploy an instance.

To operate a separate instance in your own account, use the [Render one-click deploy](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp). Once it is ready, connect its `/mcp` URL. Client setup screens differ, so there is no universal client-side command.

## npm install from GitHub

Install both the CLI and local stdio MCP launcher:

```sh
npm install --global https://codeload.github.com/jsagir/mos-stock-flow-mcp/tar.gz/refs/heads/main
```

This installs the committed prebuilt files without running a local TypeScript build. Use `mos-flow app` for the local editor, other `mos-flow` commands for model work, and `mos-mcp` for a local stdio MCP server configuration. The hosted service above requires no npm install.

The npm registry currently serves version `0.2.0`; the SystemicWorks replacement in this checkout has not been released to npm yet. From this checkout, run `npm ci && npm run build`, then `node dist/cli.js app`. The global npm install will include this editor after the next package release.
