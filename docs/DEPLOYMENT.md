# Deploy `/m:os` MCP

## Local check

```sh
npm install
npm run build
npm start
curl http://localhost:3000/health
```

The remote MCP endpoint is `POST /mcp` using stateless Streamable HTTP. Set `PORT` to the platform port. The service has no persistent storage and no provider secrets. Free hosting tiers may sleep, cap hours/bandwidth, or change availability; check their terms at deployment time.

The shared public service is deployed at `https://mos-stock-flow-mcp.vercel.app/mcp`. It runs on the Vercel Node.js Functions adapter (`api/`) and uses a stateless Streamable HTTP transport. `/health` checks service availability. The service does not persist model data.

The included `render.yaml` remains available for anyone who wants a separate Render deployment. Use the [Render one-click deploy](https://render.com/deploy?repo=https://github.com/jsagir/mos-stock-flow-mcp), then configure clients with that deployment's `/mcp` URL. Free services may sleep while idle. If a client sends an `Origin` header, set `MCP_ALLOWED_ORIGINS` to the exact comma-separated client origins in the Render service environment.

Container:

```sh
docker build -t mos-stock-flow .
docker run --rm -p 3000:3000 -e PORT=3000 mos-stock-flow
```

`GET /health` should return `{"ok":true,"service":"/m:os"}`. Roll back by redeploying the previous immutable commit/image, then check `/health` and run an MCP smoke client.
