# Distribution — get Voice Truthgate where the agents live

Goal: be **discoverable + trivially usable** inside Claude, OpenAI, Vercel, and v0. Our shape makes
this easy: one **MCP server** (`@mosadd/voice-truthgate-mcp`, on npm) + a **REST API**
([openapi.yaml](./docs/openapi.yaml)). MCP is the universal key — the same listing surfaces us in
Claude, the Vercel AI SDK, v0, and the OpenAI Agents SDK.

## The one move that lights up everything: the MCP Registry

`registry.modelcontextprotocol.io` is the canonical, self-serve index every MCP client reads. One
listing → discoverable in Claude, v0, the Vercel AI SDK, and OpenAI Agents SDK **at once**.

**✅ Live now:** `io.github.Hei33enberg/voice-truthgate-mcp` (status: active) —
[query it](https://registry.modelcontextprotocol.io/v0/servers?search=voice-truthgate-mcp). Shipped in
this repo: [`server.json`](./server.json) + a GitHub-OIDC [publish workflow](./.github/workflows/publish-mcp-registry.yml)
(no interactive login — the `io.github.Hei33enberg/*` namespace is proven by the workflow running here).
Ownership of the npm package is proven by the `mcpName` field in its `package.json`. To ship an update:
bump the version in `mcp/package.json` **and** `server.json`, run *Publish Voice Truthgate MCP* (npm)
in mosADD-OS, then re-run *Publish to MCP Registry* here.

## What's live / self-serve (done or one action away)

| Channel | Status | Note |
|---|---|---|
| **npm** — `@mosadd/voice-truthgate-mcp` | ✅ live | `npx -y @mosadd/voice-truthgate-mcp` |
| **Official MCP Registry** | ✅ live | `io.github.Hei33enberg/voice-truthgate-mcp` — canonical cross-client discovery |
| **Agent recipes** (Claude/OpenAI/Vercel/v0/LangChain) | ✅ [USE-IN-YOUR-AGENT.md](./docs/USE-IN-YOUR-AGENT.md) | copy-paste for each |
| **OpenAPI spec** (GPT Action / any tool) | ✅ [openapi.yaml](./docs/openapi.yaml) | import URL for a Custom GPT Action |
| **Vercel AI SDK example** | ✅ recipe (createMCPClient) | optional: PR an example to `vercel/ai/examples` |
| **GitHub discovery / SEO** | ✅ | repo topics: `mcp-server`, `voice-authentication`, `ai-agents` |
| **Privacy policy** (store entry requirement) | ✅ live | [mosadd.com/privacy](https://mosadd.com/privacy) — voice/biometric data |
| **Reviewer demo** (public key + clips) | ✅ [examples/demo-enroll-verify](./examples/demo-enroll-verify/) | enrol → verify → 401 in ~1 min |
| **OpenAI Custom GPT config** | ✅ [OPENAI-GPT-SETUP.md](./docs/OPENAI-GPT-SETUP.md) | paste-ready; founder clicks Create |
| **xAI Voice Agent Builder recipe** | ✅ [USE-IN-YOUR-AGENT.md](./docs/USE-IN-YOUR-AGENT.md#xai-voice-agent-builder-grok-voice) | REST tool now; remote-MCP on roadmap |

## Owner-gated (needs a founder account / partnership / review) — with exact steps

These reach end-users but require the founder's org accounts + a bit of prep. I've prepped what I can;
the rest is checklisted below.

1. **Claude Connectors Directory** (`claude.com/connectors`) — the big one for Claude's users.
   *Needs:* a **remote HTTPS MCP endpoint** (SSE/Streamable) with bearer/OAuth auth (we run stdio +
   REST today — a thin remote-MCP wrapper is the gap); a **privacy policy** at `mosadd.com/privacy`
   (voice data: what's collected/retention/processing/contact); **tool annotations**
   (verify/list = readOnly, enroll/delete = destructive); a **demo account + test key + pre-enrolled
   subject**; 3–5 screenshots. *Submit:* Claude.ai → Org Settings → Connectors → Submit. Review 2–6 wks.
2. **OpenAI GPT Store** — **config is ready** ([OPENAI-GPT-SETUP.md](./docs/OPENAI-GPT-SETUP.md)): create
   the Custom GPT in the mosADD OpenAI account (paste name/description/instructions, Import the Action
   from `openapi.yaml`, set the demo key), publish **public**. Free, ~1–3 day review. (Partner
   Marketplace = higher bar, `partnerships@openai.com`, needs a security/GDPR review.)
3. **Vercel Marketplace / Templates** — email `partnerships@vercel.com` (mention the npm package + MCP
   registry listing). Optional: submit a Next.js reference template at `vercel.com/templates/submit`.
4. **Claude Desktop Extension (`.mcpb`)** — one-click install for non-technical users; needs an
   `@anthropic-ai/mcpb`-built bundle + an icon. Low effort, self-serve.

### What the founder needs to provide (unblocks the gated channels)
- ✅ ~~privacy policy page~~ — **done**, live at `mosadd.com/privacy`.
- ✅ ~~demo/test key + pre-enrolled subject~~ — **done**, `examples/demo-enroll-verify/` (public demo key,
  subject `demo-speaker`, synthetic clips).
- ✅ ~~Custom GPT Action config~~ — **done**, `docs/OPENAI-GPT-SETUP.md`. Founder just **creates + publishes
  the GPT** in the mosADD OpenAI org (2 min; org login is the only step I can't do).
- Optional, still owner-gated: the `privacy@mosadd.com` mailbox alias; a **remote HTTPS MCP endpoint** +
  3–5 screenshots for the **Claude Connectors Directory**; the branded **`api.mosadd.com`** (Supabase
  custom-domain add-on — makes every listing look production-grade).

## Sequencing
1. **Now (self-serve):** MCP Registry publish · recipes + OpenAPI live · repo SEO. *(this PR)*
2. **This week (needs founder accounts):** Custom GPT in the GPT Store · `.mcpb` desktop extension ·
   Vercel AI SDK example PR.
3. **Partnership track (weeks):** Claude Connectors Directory · Vercel Marketplace — after the
   remote-MCP endpoint + privacy policy + demo account exist.

## Honesty / legal rail
A **loud** launch (HN, press, big claims) stays gated on **legal review** of the ToS/limitations/
defamation copy — same rail as the rest of Voice Truthgate. The distribution above is *availability*
(be there when a developer looks), not a hype campaign. Keep the "signal, not verdict" + 63%-clone
honesty in every listing.
