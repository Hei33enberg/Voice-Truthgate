# Distribution — get Voice Truthgate where the agents live

Goal: be **discoverable + trivially usable** inside Claude, OpenAI, Vercel, and v0. Our shape makes
this easy: one **MCP server** (`@mosadd/voice-truthgate-mcp`, on npm) + a **REST API**
([openapi.yaml](./docs/openapi.yaml)). MCP is the universal key — the same listing surfaces us in
Claude, the Vercel AI SDK, v0, and the OpenAI Agents SDK.

## The one move that lights up everything: the MCP Registry

`registry.modelcontextprotocol.io` is the canonical, self-serve index every MCP client reads. One
listing → discoverable in Claude, v0, the Vercel AI SDK, and OpenAI Agents SDK **at once**. Shipped in
this repo: [`server.json`](./server.json) + a GitHub-OIDC [publish workflow](./.github/workflows/publish-mcp-registry.yml)
(no interactive login — the `io.github.hei33enberg/*` namespace is proven by the workflow running
here). Re-run it after a version bump.

## What's live / self-serve (done or one action away)

| Channel | Status | Note |
|---|---|---|
| **npm** — `@mosadd/voice-truthgate-mcp` | ✅ live | `npx -y @mosadd/voice-truthgate-mcp` |
| **Official MCP Registry** | ⚙️ workflow ready | run *Publish to MCP Registry* → canonical discovery |
| **Agent recipes** (Claude/OpenAI/Vercel/v0/LangChain) | ✅ [USE-IN-YOUR-AGENT.md](./docs/USE-IN-YOUR-AGENT.md) | copy-paste for each |
| **OpenAPI spec** (GPT Action / any tool) | ✅ [openapi.yaml](./docs/openapi.yaml) | import URL for a Custom GPT Action |
| **Vercel AI SDK example** | ✅ recipe (createMCPClient) | optional: PR an example to `vercel/ai/examples` |
| **GitHub discovery / SEO** | ✅ | repo topics: `mcp-server`, `voice-authentication`, `ai-agents` |

## Owner-gated (needs a founder account / partnership / review) — with exact steps

These reach end-users but require the founder's org accounts + a bit of prep. I've prepped what I can;
the rest is checklisted below.

1. **Claude Connectors Directory** (`claude.com/connectors`) — the big one for Claude's users.
   *Needs:* a **remote HTTPS MCP endpoint** (SSE/Streamable) with bearer/OAuth auth (we run stdio +
   REST today — a thin remote-MCP wrapper is the gap); a **privacy policy** at `mosadd.com/privacy`
   (voice data: what's collected/retention/processing/contact); **tool annotations**
   (verify/list = readOnly, enroll/delete = destructive); a **demo account + test key + pre-enrolled
   subject**; 3–5 screenshots. *Submit:* Claude.ai → Org Settings → Connectors → Submit. Review 2–6 wks.
2. **OpenAI GPT Store** — create a Custom GPT in the mosADD OpenAI account, add the Action (import
   `openapi.yaml`), set **public**, publish. Free, ~48–72h review. (Partner Marketplace = higher bar,
   `partnerships@openai.com`, needs a security/GDPR review.)
3. **Vercel Marketplace / Templates** — email `partnerships@vercel.com` (mention the npm package + MCP
   registry listing). Optional: submit a Next.js reference template at `vercel.com/templates/submit`.
4. **Claude Desktop Extension (`.mcpb`)** — one-click install for non-technical users; needs an
   `@anthropic-ai/mcpb`-built bundle + an icon. Low effort, self-serve.

### What the founder needs to provide (unblocks the gated channels)
- A **privacy policy** page for voice/biometric data (`mosadd.com/privacy`).
- A **demo/test account + a test API key** with a pre-enrolled subject (for reviewers).
- Go-ahead to create the **Custom GPT** in the mosADD OpenAI org (I'll supply the Action config).
- The branded **`api.mosadd.com`** (helps every listing look production-grade — separate task, gated
  on the Supabase custom-domain add-on).

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
