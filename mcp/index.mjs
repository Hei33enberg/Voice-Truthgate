#!/usr/bin/env node
// =============================================================================
// Voice Truthgate — MCP server (stdio).
//
// Exposes the Voice Truthgate market API as MCP tools so any AI agent (Claude, our
// own fleet, a customer's agent) can enrol a voice and verify a call clip and get an
// HONEST authenticity verdict. Thin wrapper over the REST API — the engine key and the
// biometric never touch this process; it only forwards the customer's X-API-Key.
//
// Config (env):
//   VTG_API_KEY   (required)  your Voice Truthgate customer API key
//   VTG_API_URL   (optional)  override the API endpoint (defaults to the hosted one)
//
// Run:  VTG_API_KEY=... npx @mosadd/voice-truthgate-mcp
// =============================================================================
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const API_URL = process.env.VTG_API_URL ||
  "https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api";
const API_KEY = process.env.VTG_API_KEY;
if (!API_KEY) {
  console.error("[voice-truthgate-mcp] VTG_API_KEY environment variable is required.");
  process.exit(1);
}

/** POST a multipart request to the market API. Audio files are read from local paths. */
async function callApi(fields, audioPaths = []) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v != null && v !== "") form.append(k, String(v));
  for (const p of audioPaths) {
    const buf = await readFile(p);
    form.append("audio", new Blob([buf]), basename(p) || "clip");
  }
  const res = await fetch(API_URL, { method: "POST", headers: { "X-API-Key": API_KEY }, body: form });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { ok: false, http_status: res.status, body: text }; }
}

const TOOLS = [
  {
    name: "voice_truthgate_verify",
    description:
      "Verify a voice clip against an enrolled subject. Returns an HONEST verdict " +
      "(likely_same_person / likely_different_person / inconclusive / not_enrolled) with a " +
      "confidence band and a synthetic-voice caution. A match is a supporting SIGNAL, not proof " +
      "of a live human (a targeted clone can match) — combine with identity + a liveness step for " +
      "high-stakes actions.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "The enrolled subject to check against." },
        audio_path: { type: "string", description: "Local path to the voice clip (any common audio format)." },
        threshold: { type: "number", description: "Optional cosine-similarity threshold override (default 0.53)." },
      },
      required: ["subject_id", "audio_path"],
    },
  },
  {
    name: "voice_truthgate_enroll",
    description:
      "Enrol (or re-enrol) a subject's voiceprint from one or more clean audio clips. Only enrol " +
      "with the subject's consent; voiceprints are biometric data. More/longer clips = a stronger print.",
    inputSchema: {
      type: "object",
      properties: {
        subject_id: { type: "string", description: "A stable id you choose for this person." },
        audio_paths: { type: "array", items: { type: "string" }, description: "Local paths to 1+ enrolment clips." },
      },
      required: ["subject_id", "audio_paths"],
    },
  },
  {
    name: "voice_truthgate_list_subjects",
    description: "List the subjects enrolled under your API key (metadata only, never the biometric).",
    inputSchema: { type: "object", properties: {} },
  },
];

const server = new Server({ name: "voice-truthgate", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    let out;
    if (name === "voice_truthgate_verify")
      out = await callApi({ action: "verify", subject_id: args.subject_id, threshold: args.threshold }, [args.audio_path]);
    else if (name === "voice_truthgate_enroll")
      out = await callApi({ action: "enroll", subject_id: args.subject_id }, args.audio_paths || []);
    else if (name === "voice_truthgate_list_subjects")
      out = await callApi({ action: "subjects" });
    else throw new Error(`unknown tool: ${name}`);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  } catch (e) {
    return { content: [{ type: "text", text: `error: ${e?.message || String(e)}` }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
console.error("[voice-truthgate-mcp] ready (stdio).");
