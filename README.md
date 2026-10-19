# `/m:os` systems mapping

Free systems mapping for practitioners and students: a local-first SystemicWorks visual editor, a CLI, and an MCP server. The visual editor is based on [SystemicWorks](https://github.com/JuanCSUCoder/SystemicWorks) and its causal-loop diagramming canvas. The `/m:os` data model and CLI also describe stocks, material flows, causal variables, evidence, and feedback loops. No LLM provider key is required.

## Hosted MCP

Connect your MCP client to **https://mos-stock-flow-mcp.vercel.app/mcp**. This is the shared `/m:os` service; users do not need to deploy it. It uses stateless Streamable HTTP and does not save or log submitted model content. See the [service page](https://mos-stock-flow-mcp.vercel.app/) and [host connection guide](docs/INSTALL.md).

## Install CLI and local MCP

Install the published CLI directly from npm:

```sh
npm install --global @jsagir/mos-stock-flow-mcp
mos-flow init -o garden.json
```

The package includes the prebuilt visual editor, CLI, and MCP server, so users do not need TypeScript or a local build toolchain. For a local MCP client, set its server command to `mos-mcp`.

The npm registry currently serves version `0.2.0`; this checkout's SystemicWorks replacement is newer and has not been released to npm. From this checkout, build with `npm ci && npm run build`, then run `node dist/cli.js app`. The npm install command will pick up this editor after the next package release.

Run the visual editor entirely on your computer:

```sh
mos-flow app
```

Open the printed `127.0.0.1` URL. Projects autosave to that browser's IndexedDB using RxDB and its free Dexie adapter. The app does not require an account or remote database. Stop the local server with Ctrl+C.

## Local MCP setup

From a downloaded or cloned project directory, run `./install.sh`. It installs pinned dependencies, builds, links `mos-flow`, and writes `.mcp.json` with the local stdio MCP command. Add that entry to a client that supports local MCP servers. The installer does not rewrite client settings.

## CLI quick start

```sh
mos-flow init -o garden.json
mos-flow validate garden.json
mos-flow show garden.json
mos-flow export garden.json --format svg -o garden.html
```

`-` means stdin or stdout. `init` and export write to stdout by default; use `-o FILE` for explicit local writes. The hosted Streamable HTTP transport listens on `/mcp`; `/health` is a health check.

See [`examples/repository-delivery.html`](examples/repository-delivery.html) for a stock-and-flow map of this repository's own validation, hosted deployment, and npm release path. Its assumptions and evidence are recorded in the accompanying JSON. The fictional [`Lantern Home eCommerce example`](examples/theo-inspired-ecommerce.html) uses a Theo Agency case study as a prompt; reported case outcomes are separated from the model's hypotheses in [`the source JSON`](examples/theo-inspired-ecommerce.json).

Stocks are accumulations. Flows are material/rate changes to a stock. Causal variables represent non-accumulating conditions; dashed influence links connect variables, stocks, actors, and system levels. The model format accepts existing schema `1.0` files and writes schema `1.1` when causal variables are added. Short feedback cycles are identified from the mapped links and labeled reinforcing (R), balancing (B), or unknown from their polarities. The scan is bounded for large, dense maps. These labels describe the diagram's logic, not verified real-world effects. Each claim is `observed`, `reported`, `inferred`, `hypothesis`, or `unknown`; missing quantities stay null/unknown.

The visual project and its canonical `/m:os` model save to the browser's local IndexedDB database through RxDB and the free Dexie storage adapter. No account, sync service, or remote database is required. MCP hosts can restrict storage inside embedded Apps; if that happens, **Save `/m:os` JSON** and open it in the direct localhost editor using **Open `/m:os` JSON**. The hosted MCP itself is stateless and does not store submitted model content. Cross-device replication is not enabled.

The original SystemicWorks drawing tools focus on causal-loop diagrams. When an MCP tool supplies a `/m:os` model, the replacement canvas renders stock accumulations as boxes, material flows as blue pipes with valve marks, and causal influences with polarity signs; the side panel preserves rates, evidence, actors, levels, assumptions, and feedback loops. This structural map does not calculate stock levels over time. Direct manual creation/editing of stock and flow types and numerical simulation remain future extensions; the `/m:os` CLI and MCP model tools already validate and export the full model.

The workflow is a **PWS-informed proposed adaptation**, not a validated PWS procedure: define boundary and purpose; map causal loops; identify stocks, flows and delays; map nested levels; then compare leverage hypotheses. Wicked problems can have disputed boundaries and no final stopping rule. A map makes claims discussable; it does not prove causation or settle disagreement. See `docs/METHOD.md`.

LangTalks informed implementation quality patterns through local source/code research; no live LangTalks graph MCP was available or queried.

SystemicWorks is distributed under GPL-3.0. Its upstream license and source attribution are retained in [`vendor/systemicworks`](vendor/systemicworks) and [`NOTICE.md`](NOTICE.md). The `/m:os` additions include the local RxDB workspace, packaged CLI launch, and MCP resource integration.

## Deploy your own instance

[![Deploy `/m:os` to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp)

The Render button is for people who want their own isolated deployment. It is optional; the shared endpoint above is ready to connect.

MCP client configuration menus and MCP Apps rendering vary by host. See `docs/INSTALL.md` and `docs/DEPLOYMENT.md`.
