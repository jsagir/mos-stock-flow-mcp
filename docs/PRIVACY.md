# `/m:os` privacy

- The CLI reads/writes local files only when you provide a path. It can also use stdin/stdout.
- MCP tools require the caller to provide the full model each time. No model store, account, telemetry, or server-side LLM provider is included.
- The HTTP handler creates a fresh stateless transport for each request; model data is not kept in an in-memory session.
- The server does not intentionally log request bodies. The HTTP process logs startup only.
- MCP hosts and network infrastructure may have their own logging and retention. Review their policies before sending sensitive models.
- The example model is synthetic. Do not include confidential data unless the selected host and deployment are appropriate for it.
