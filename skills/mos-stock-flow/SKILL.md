---
name: mos-stock-flow
description: Use `/m:os` MCP tools or `mos-flow` CLI to map a system as stocks, flows, causal loops, delays, nested levels and leverage hypotheses. Apply when a user wants to understand system behavior, feedback, accumulation, or a wicked problem.
---

# `/m:os` stock-and-flow mapping

Use `/m:os` complete-model tools when available. The service does not keep model state: always pass the full model and retain the complete result returned. If MCP is unavailable, use `mos-flow` CLI and the same JSON model.

## Work sequence

1. Clarify purpose, boundary, time horizon, actors, evidence and disputed scope. Preserve unknowns as `null` and status `unknown`.
2. Draft causal links and inspect reinforcing/balancing loops. Use polarity `positive`, `negative` or `unknown`; treat unverified arrows as hypotheses.
3. Identify stocks as accumulations and flows as rates that change stocks. Record delays. Never invent measurements or conflate causal links with material flows.
4. Add nested levels and note what lies outside the boundary or who may contest it.
5. Compare leverage hypotheses at parameter, information, rule, goal and assumption levels. Include affected actors and uncertainty; do not present an intervention as proven.
6. Call `model_validate` before export. Return the full model or clear field-specific issues.

## MCP tools

- `model_create`: accept a complete v1 JSON draft and return the complete validated model.
- `model_update`: replace supplied model and return the complete validated model. The server retains no prior state.
- `model_validate`: return field-specific validation results.
- `model_get`: validate and return supplied model.
- `model_export`: return JSON or standalone SVG HTML.

The MCP App is optional. Without it, use returned structured JSON/text. Rendering depends on host support.

## CLI fallback

```sh
mos-flow init -o system.json
mos-flow validate system.json
mos-flow show system.json
mos-flow export system.json --format svg -o system.html
```

`-` means stdin/stdout. Writes require an explicit `-o FILE` destination.

## Method status

This sequence is a **PWS-informed proposed adaptation**, not a validated PWS procedure. Wicked systems may have contested boundaries and no final stopping rule. Diagrams are inquiry aids; they do not prove causality, eliminate uncertainty or resolve disagreement. Do not silently turn hypotheses into findings.
