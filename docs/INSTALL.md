# Install `/m:os`

## Local one-command install

Download or clone the project, open its directory, and run `./install.sh`. It requires Node.js 20+ and npm, installs pinned dependencies, builds, links `mos-flow`, and writes `.mcp.json`. Review that file and copy its `mcpServers.mos-systems` entry into your MCP client settings. The script does not edit client settings because paths and config formats differ.

After setup, run `mos-flow init -o example.json`, `mos-flow validate example.json`, or `mos-flow export example.json --format svg -o example.html`. For local MCP use `node /absolute/path/to/dist/server/stdio.js`. Text and structured JSON work in non-App clients; App rendering requires MCP Apps support.

## Hosted connector

Deploy the public repository's Render blueprint with the [Render one-click deploy](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp). Once Render provisions the service, add its HTTPS URL ending in `/mcp` using the host's custom MCP connector flow. This creates a free deployment in your hosting account; the project does not operate a shared endpoint. Client setup screens differ, so there is no universal client-side command.

For the CLI, install straight from GitHub with `npm install --global github:jsagir/mos-stock-flow-mcp`. A registry package may be added separately in a future release.
