# `/m:os` stock and flow mapper

Free, standalone system mapping through one versioned JSON model, a CLI, an MCP server, and an MCP Apps editor. Use it with any MCP-capable model host or as a command-line tool. Models stay with the caller; the server does not save or log submitted model content. No LLM provider key is required.

## One-click hosted MCP

[![Deploy `/m:os` to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp)

Deploy the free blueprint, then add the generated service URL ending in `/mcp` to an MCP client that supports remote Streamable HTTP. Render may sleep free services when idle. This is a one-time deployment to your hosting account; the project does not operate a shared hosted endpoint.

## One-command CLI install

Install the CLI directly from GitHub:

```sh
npm install --global github:jsagir/mos-stock-flow-mcp
mos-flow init -o garden.json
```

The GitHub package builds itself during installation. For local MCP, configure your client with the installed `dist/server/stdio.js` path, or clone the repository and use `./install.sh` to generate a ready-to-copy config entry.

## Local MCP setup

From a downloaded or cloned project directory, run `./install.sh`. It installs pinned dependencies, builds, links `mos-flow`, and writes `.mcp.json` with the local stdio MCP command. Add that entry to a client that supports local MCP servers. The installer does not rewrite client settings.

## Quick start

```sh
mos-flow init -o garden.json
mos-flow validate garden.json
mos-flow show garden.json
mos-flow export garden.json --format svg -o garden.html
```

`-` means stdin or stdout. `init` and export write to stdout by default; use `-o FILE` for explicit local writes. The hosted Streamable HTTP transport listens on `/mcp`; `/health` is a health check.

Stocks are accumulations. Flows are material/rate changes to a stock. Causal links represent influence hypotheses and remain a separate type. Each claim is `observed`, `reported`, `inferred`, `hypothesis`, or `unknown`. Missing quantities stay null/unknown. The included community garden example is synthetic.

The workflow is a **PWS-informed proposed adaptation**, not a validated PWS procedure: define boundary and purpose; map causal loops; identify stocks, flows and delays; map nested levels; then compare leverage hypotheses. Wicked problems can have disputed boundaries and no final stopping rule. A map makes claims discussable; it does not prove causation or settle disagreement. See `docs/METHOD.md`.

LangTalks informed implementation quality patterns through local source/code research; no live LangTalks graph MCP was available or queried.

MCP client configuration menus and MCP Apps rendering vary by host. See `docs/INSTALL.md` and `docs/DEPLOYMENT.md`.
