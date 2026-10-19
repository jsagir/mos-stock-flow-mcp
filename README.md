# `/m:os` stock and flow mapper

Free, standalone system mapping through one versioned JSON model, a CLI, an MCP server, and an MCP Apps editor. Use it with any MCP-capable model host or as a command-line tool. Models stay with the caller; the server does not save or log submitted model content. No LLM provider key is required.

## Hosted MCP

Connect your MCP client to **https://mos-stock-flow-mcp.vercel.app/mcp**. This is the shared `/m:os` service; users do not need to deploy it. It uses stateless Streamable HTTP and does not save or log submitted model content. See the [service page](https://mos-stock-flow-mcp.vercel.app/) and [host connection guide](docs/INSTALL.md).

## Install CLI and local MCP

Install directly from GitHub with npm:

```sh
npm install --global https://codeload.github.com/jsagir/mos-stock-flow-mcp/tar.gz/refs/heads/main
mos-flow init -o garden.json
```

This installs the prebuilt release, so users do not need TypeScript or a local build toolchain. For a local MCP client, set its server command to `mos-mcp`. To install from a source checkout, run `./install.sh`.

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

See [`examples/repository-delivery.html`](examples/repository-delivery.html) for a stock-and-flow map of this repository's own validation, hosted deployment, and npm release path. Its assumptions and evidence are recorded in the accompanying JSON.

Stocks are accumulations. Flows are material/rate changes to a stock. Causal links represent influence hypotheses and remain a separate type. Each claim is `observed`, `reported`, `inferred`, `hypothesis`, or `unknown`. Missing quantities stay null/unknown. The included community garden example is synthetic.

The workflow is a **PWS-informed proposed adaptation**, not a validated PWS procedure: define boundary and purpose; map causal loops; identify stocks, flows and delays; map nested levels; then compare leverage hypotheses. Wicked problems can have disputed boundaries and no final stopping rule. A map makes claims discussable; it does not prove causation or settle disagreement. See `docs/METHOD.md`.

LangTalks informed implementation quality patterns through local source/code research; no live LangTalks graph MCP was available or queried.

## Deploy your own instance

[![Deploy `/m:os` to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp)

The Render button is for people who want their own isolated deployment. It is optional; the shared endpoint above is ready to connect.

MCP client configuration menus and MCP Apps rendering vary by host. See `docs/INSTALL.md` and `docs/DEPLOYMENT.md`.
