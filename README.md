# `/m:os` stock and flow mapper

Free, standalone system mapping through one versioned JSON model, a CLI, an MCP server, and an MCP Apps editor. Use it with any MCP-capable model host or as a command-line tool. Models stay with the caller; the server does not save or log submitted model content. No LLM provider key is required.

## Hosted MCP

Connect your MCP client to **https://mos-stock-flow-mcp.vercel.app/mcp**. This is the shared `/m:os` service; users do not need to deploy it. It uses stateless Streamable HTTP and does not save or log submitted model content. See the [service page](https://mos-stock-flow-mcp.vercel.app/) and [host connection guide](docs/INSTALL.md).

## Install CLI and local MCP

Install the published CLI directly from npm:

```sh
npm install --global @jsagir/mos-stock-flow-mcp
mos-flow init -o garden.json
```

The package includes the prebuilt canvas, CLI, and MCP server, so users do not need TypeScript or a local build toolchain. For a local MCP client, set its server command to `mos-mcp`. To install from a source checkout, run `./install.sh`.

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

See [`examples/repository-delivery.html`](examples/repository-delivery.html) for a stock-and-flow map of this repository's own validation, hosted deployment, and npm release path. Its assumptions and evidence are recorded in the accompanying JSON. The fictional [`Lantern Home eCommerce example`](examples/theo-inspired-ecommerce.html) uses a Theo Agency case study as a prompt; reported case outcomes are separated from the model's hypotheses in [`the source JSON`](examples/theo-inspired-ecommerce.json).

Stocks are accumulations. Flows are material/rate changes to a stock. Causal variables represent non-accumulating conditions; dashed influence links connect variables, stocks, actors, and system levels. The model format accepts existing schema `1.0` files and writes schema `1.1` when causal variables are added. Short feedback cycles are identified from the mapped links and labeled reinforcing (R), balancing (B), or unknown from their polarities. The scan is bounded for large, dense maps. These labels describe the diagram's logic, not verified real-world effects. Each claim is `observed`, `reported`, `inferred`, `hypothesis`, or `unknown`; missing quantities stay null/unknown.

The canvas autosaves a draft to the local browser when storage is available. **Save as file** exports portable model JSON. **Copy share link** encodes the current model in the URL fragment; it does not upload the model, but anyone with the link can read its contents. The hosted MCP itself is stateless and does not store submitted model content.

On the canvas, choose **Variable** to add a condition such as garden quality, **Influence** to connect a possible cause to an effect, and **Stock** plus **Flow** for amounts and the rates that change them. Click an item to edit its meaning and evidence. Add `+` when the conditions tend to move in the same direction, `−` when they tend to move in opposite directions, and `?` when direction is unclear. The feedback loop list updates from these links. **Trace** steps through reachable influence links and highlights the accumulated direction of their signs. This is qualitative path exploration; it does not calculate outcomes or simulate delays.

The workflow is a **PWS-informed proposed adaptation**, not a validated PWS procedure: define boundary and purpose; map causal loops; identify stocks, flows and delays; map nested levels; then compare leverage hypotheses. Wicked problems can have disputed boundaries and no final stopping rule. A map makes claims discussable; it does not prove causation or settle disagreement. See `docs/METHOD.md`.

LangTalks informed implementation quality patterns through local source/code research; no live LangTalks graph MCP was available or queried.

## Deploy your own instance

[![Deploy `/m:os` to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp)

The Render button is for people who want their own isolated deployment. It is optional; the shared endpoint above is ready to connect.

MCP client configuration menus and MCP Apps rendering vary by host. See `docs/INSTALL.md` and `docs/DEPLOYMENT.md`.
