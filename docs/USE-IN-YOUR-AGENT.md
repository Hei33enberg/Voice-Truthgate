# Use Voice Truthgate in your agent

One tool, every ecosystem. Voice Truthgate ships as an **MCP server** (`@mosadd/voice-truthgate-mcp`,
on npm) and a **REST API** ([OpenAPI spec](./openapi.yaml)) — so it drops into Claude, the OpenAI
Agents SDK, the Vercel AI SDK, v0, LangChain, and anything that speaks MCP or HTTP.

Get a key at **[mosadd.com](https://mosadd.com)** (`vtg_live_…`) and set it as `VTG_API_KEY`. Tools:
`voice_truthgate_enroll`, `voice_truthgate_verify`, `voice_truthgate_list_subjects`.

> **Honesty rail:** a match is a **signal, not a verdict** — a targeted clone can match a real
> voiceprint (≈63% in our tests). Fuse it with identity + a liveness step for high-stakes actions.

---

## Claude (Claude Code / Desktop / any MCP client)

```bash
claude mcp add voice-truthgate -- npx -y @mosadd/voice-truthgate-mcp
```

Or in `claude_desktop_config.json` / `.mcp.json`:

```json
{
  "mcpServers": {
    "voice-truthgate": {
      "command": "npx",
      "args": ["-y", "@mosadd/voice-truthgate-mcp"],
      "env": { "VTG_API_KEY": "vtg_live_your_key" }
    }
  }
}
```

Then ask Claude: *"Verify the caller against subject `acme-ceo` — the clip is at `/tmp/call.wav`."*

## OpenAI

**a) As a GPT Action (Custom GPT).** In the GPT editor → **Actions** → *Import from URL* and paste the
raw OpenAPI schema:

```
https://raw.githubusercontent.com/Hei33enberg/voice-truthgate/main/docs/openapi.yaml
```

Set Authentication → **API Key** → header `X-API-Key` → your `vtg_live_…`. (Note: GPT Actions can't
upload binary audio from chat — best for `subjects`/`verify` where your backend supplies the clip; for
full audio flows use the Agents SDK + MCP below.)

**b) With the OpenAI Agents SDK / Responses API (MCP).** Point it at the MCP server:

```python
from agents import Agent
from agents.mcp import MCPServerStdio

vt = MCPServerStdio(params={
    "command": "npx", "args": ["-y", "@mosadd/voice-truthgate-mcp"],
    "env": {"VTG_API_KEY": "vtg_live_your_key"},
})
agent = Agent(name="support", instructions="Verify callers before sensitive actions.", mcp_servers=[vt])
```

## Vercel AI SDK

Native MCP client — auto-discovers the tools:

```ts
import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as Stdio } from "ai/mcp-stdio";

const client = await createMCPClient({
  transport: new Stdio({ command: "npx", args: ["-y", "@mosadd/voice-truthgate-mcp"],
    env: { VTG_API_KEY: process.env.VTG_API_KEY! } }),
});
const tools = await client.tools(); // → voice_truthgate_verify, _enroll, _list_subjects
// pass `tools` to generateText / streamText
```

## v0 (Vercel generative UI)

v0 builds on the AI SDK — the Vercel snippet above works inside a v0-generated app. When you don't
wire up MCP, have v0 generate code that calls the REST API directly:

```ts
const res = await fetch("$VTG_URL", {
  method: "POST",
  headers: { "X-API-Key": process.env.VTG_API_KEY! },
  body: (() => { const f = new FormData();
    f.append("action", "verify"); f.append("subject_id", "acme-ceo");
    f.append("audio", audioBlob, "call.wav"); return f; })(),
});
const verdict = await res.json(); // { verdict, confidence_band, synthetic_caution, disclaimer, ... }
```

## xAI Voice Agent Builder (Grok Voice)

xAI's [Voice Agent Builder](https://x.ai/voice) lets an agent **wire your APIs** and **connect MCP
servers** — so a Grok voice agent can check a caller's voice before a high-stakes action. Two paths:

- **REST tool (works today):** add a custom tool that POSTs the captured caller audio to
  `…/voice-truthgate-api` with `action=verify` + the `X-API-Key` header, then gate the sensitive step on
  the returned `verdict` / `confidence_band`. Because a match is a *signal, not a verdict* (a clone can
  match), always pair it with a short **liveness/challenge** step for anything high-stakes.
- **MCP (remote) — LIVE:** point a hosted builder that "connects MCP servers" at
  **`https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-mcp`** (auth =
  `Authorization: Bearer vtg_live_…`; `verify`/`enroll` take an audio **URL**). Same three tools as the
  stdio server, identical honest verdicts. (Source: [`remote-mcp/`](../remote-mcp) for a self-hosted
  variant.)

## LangChain / anything else

Any MCP-compatible client loads it the same way (`npx -y @mosadd/voice-truthgate-mcp` + `VTG_API_KEY`),
or call the [REST API](./VOICE-TRUTHGATE-API.md) directly. Full request/response shapes:
[openapi.yaml](./openapi.yaml).

---

**Try it in 2 minutes:** a runnable enrol → verify demo with a public key + synthetic clips lives at
[`../examples/demo-enroll-verify/`](../examples/demo-enroll-verify/). Ship a Custom GPT with
[`OPENAI-GPT-SETUP.md`](./OPENAI-GPT-SETUP.md).
