# Voice Truthgate — remote (HTTP) MCP server

The endpoint hosted agent platforms connect to when they take a **remote MCP URL** rather than a local
stdio command: the **Claude Connectors Directory**, **xAI Voice Agent Builder**, the **OpenAI Agents
SDK**, etc. Same tools as the stdio server ([`../mcp`](../mcp)), over Streamable HTTP.

- **Transport:** Streamable HTTP, stateless JSON mode (the same pattern as `mcp.mosadd.com`).
- **Auth:** per request — send your Voice Truthgate key as `Authorization: Bearer vtg_live_…`. The server
  forwards it to the market API as `X-API-Key`; the engine key and the biometric never touch this process.
- **Audio:** an HTTP server can't read your local files, so `verify` / `enroll` take an **audio URL**
  (the server fetches it), unlike the stdio server which takes a local path.
- **Tools:** `voice_truthgate_verify` (readOnly), `voice_truthgate_list_subjects` (readOnly),
  `voice_truthgate_enroll` (destructive — replaces a subject's voiceprint).

## Run locally

```bash
npm install
node server.mjs           # listens on :3030 (PORT to override)
# health:
curl -s localhost:3030/health
# MCP (Bearer = your vtg_live_… key):
curl -s -X POST localhost:3030/mcp \
  -H "Authorization: Bearer vtg_live_…" \
  -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Deploy (Docker, behind a TLS reverse proxy)

The reference deployment runs on the same box as the compute API (`truthgate-api.mosadd.com`), on the
`vtgnet` docker network, with Caddy terminating TLS. Runbook:

```bash
# 1. copy server.mjs + package.json + Dockerfile to the box (e.g. /opt/vtg-mcp)
# 2. build + run on the shared network (internal :3030, no host port — Caddy proxies it):
cd /opt/vtg-mcp && docker build -t vtg-mcp .
docker rm -f vtg-mcp 2>/dev/null; docker run -d --name vtg-mcp --restart unless-stopped --network vtgnet vtg-mcp
# 3. add a Caddy site block (auto-TLS) — a distinct hostname, existing blocks untouched:
#    mcp-truthgate.mosadd.com {           # (or mcp.<ip>.sslip.io for a no-DNS bootstrap)
#        reverse_proxy vtg-mcp:3030
#    }
#    then: docker exec caddy caddy reload --config /etc/caddy/Caddyfile
# 4. verify the handshake over HTTPS:
curl -s -X POST https://mcp-truthgate.mosadd.com/mcp \
  -H "Authorization: Bearer vtg_live_…" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"voice_truthgate_list_subjects","arguments":{}}}'
```

Owner-gated (global-effect changes, one approval each): the **DNS A-record**
`mcp-truthgate.mosadd.com → <box IP>` and the **first deploy to the shared production box**.
