# Deploy `/m:os` MCP

## Local check

```sh
npm install
npm run build
npm start
curl http://localhost:3000/health
```

The remote MCP endpoint is `POST /mcp` using stateless Streamable HTTP. Set `PORT` to the platform port. The service has no persistent storage and no provider secrets. Free hosting tiers may sleep, cap hours/bandwidth, or change availability; check their terms at deployment time.

The included `render.yaml` defines a free-tier web service. Use the [Render one-click deploy](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp), then configure clients with `https://<your-host>/mcp` where remote Streamable HTTP is supported. This deploys into the user's Render account. Free services may sleep while idle. If a client sends an `Origin` header, set `MCP_ALLOWED_ORIGINS` to the exact comma-separated client origins in the Render service environment.

Container:

```sh
docker build -t mos-stock-flow .
docker run --rm -p 3000:3000 -e PORT=3000 mos-stock-flow
```

`GET /health` should return `{"ok":true,"service":"/m:os"}`. Roll back by redeploying the previous immutable commit/image, then check `/health` and run an MCP smoke client. The repository provides a deployment blueprint; it does not provide a shared project-operated endpoint.
