#!/usr/bin/env node
// =============================================================================
// Voice Truthgate — REMOTE (Streamable HTTP) MCP server.
//
// The same tools as the stdio server (../mcp), but reachable over HTTPS so hosted
// agent platforms that connect to a REMOTE MCP URL can use it: the Claude Connectors
// Directory, xAI Voice Agent Builder, the OpenAI Agents SDK, etc.
//
// Auth is per-request: the caller sends their Voice Truthgate key as
//   Authorization: Bearer vtg_live_…
// and the server forwards it to the market API as X-API-Key. The engine key and the
// biometric never touch this process; one process safely serves many tenants because
// a fresh server is built per request with only that caller's key in scope.
//
// Remote note: an HTTP server can't read a client's local files, so verify/enroll take
// an audio URL (the server fetches it) rather than a local path.
//
// Config (env): VTG_API_URL (optional), PORT (default 3030).
// Transport: Streamable HTTP, stateless JSON mode (mirrors mosADD's mcp.mosadd.com).
// =============================================================================
import { createServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_URL =
  process.env.VTG_API_URL || "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api";
const PORT = parseInt(process.env.PORT || "3030", 10);
const KEY_RE = /^vtg_live_[a-f0-9]{8,}$/i;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024; // mirror the market API per-clip cap

const TOOLS = [
  {
    name: "voice_truthgate_verify",
    description:
      "Verify a voice clip against an enrolled subject. Returns an HONEST verdict " +
      "(likely_same_person / likely_different_person / inconclusive / not_enrolled) with a confidence " +
      "band and a synthetic-voice caution. A match is a supporting SIGNAL, not proof of a live human " +
      "(a targeted clone can match) — combine with identity + a liveness step for high-stakes actions.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "The enrolled subject to check against." },
        audio_url: { type: "string", description: "HTTPS URL of the voice clip to verify (the server fetches it)." },
        threshold: { type: "number", description: "Optional cosine-similarity threshold override (default 0.53)." },
      },
      required: ["subject_id", "audio_url"],
    },
    annotations: { title: "Verify a voice", readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "voice_truthgate_enroll",
    description:
      "Enrol (or re-enrol) a subject's voiceprint from one or more clean audio clips (given as URLs). " +
      "Only enrol with the subject's consent — voiceprints are biometric data. Re-enrolling REPLACES the " +
      "stored voiceprint for that subject.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "A stable id you choose for this person." },
        audio_urls: { type: "array", items: { type: "string" }, description: "HTTPS URLs of 1+ enrolment clips." },
      },
      required: ["subject_id", "audio_urls"],
    },
    annotations: { title: "Enrol a voice", readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  },
  {
    name: "voice_truthgate_list_subjects",
    description: "List the subjects enrolled under your API key (metadata only, never the biometric).",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "List enrolled subjects", readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  },
];

/** Fetch an audio URL into a Blob, size-capped. */
async function fetchAudio(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`could not fetch audio_url (${r.status})`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.byteLength > MAX_AUDIO_BYTES) throw new Error("audio clip too large (max 12MB)");
  let name = "clip";
  try { name = new URL(url).pathname.split("/").pop() || "clip"; } catch { /* keep default */ }
  return { blob: new Blob([buf]), name };
}

/** POST a multipart request to the market API with the caller's key. */
async function callApi(apiKey, fields, audioUrls = []) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v != null && v !== "") form.append(k, String(v));
  for (const url of audioUrls) {
    const { blob, name } = await fetchAudio(url);
    form.append("audio", blob, name);
  }
  const res = await fetch(API_URL, { method: "POST", headers: { "X-API-Key": apiKey }, body: form, signal: AbortSignal.timeout(90_000) });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: false, http_status: res.status, body: text }; }
}

/** A fresh MCP server bound to ONE caller's key (per-request isolation). */
function createVtgServer(apiKey) {
  const server = new Server({ name: "voice-truthgate", version: "0.1.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
      let out;
      if (name === "voice_truthgate_verify")
        out = await callApi(apiKey, { action: "verify", subject_id: args.subject_id, threshold: args.threshold }, args.audio_url ? [args.audio_url] : []);
      else if (name === "voice_truthgate_enroll")
        out = await callApi(apiKey, { action: "enroll", subject_id: args.subject_id }, args.audio_urls || []);
      else if (name === "voice_truthgate_list_subjects")
        out = await callApi(apiKey, { action: "subjects" });
      else throw new Error(`unknown tool: ${name}`);
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `error: ${e?.message || String(e)}` }], isError: true };
    }
  });
  return server;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type, mcp-session-id, mcp-protocol-version");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");
}
function rpcError(res, status, code, message) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return undefined;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return undefined; }
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") { setCors(res); res.writeHead(204); res.end(); return; }
  if (req.method === "GET" && (req.url === "/health" || req.url === "/")) {
    setCors(res); res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, server: "voice-truthgate-remote-mcp", transport: "streamable-http" }));
    return;
  }
  const auth = req.headers["authorization"];
  const apiKey = (typeof auth === "string" ? auth : "").replace(/^Bearer\s+/i, "").trim();
  if (!KEY_RE.test(apiKey)) {
    rpcError(res, 401, -32001, "Unauthorized — send Authorization: Bearer vtg_live_… (get a key at https://mosadd.com).");
    return;
  }
  const parsedBody = await readBody(req);
  const server = createVtgServer(apiKey);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { void transport.close(); void server.close(); });
  setCors(res);
  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
}).listen(PORT, () => console.error(`[voice-truthgate-remote-mcp] listening on :${PORT} (streamable-http, stateless JSON)`));
