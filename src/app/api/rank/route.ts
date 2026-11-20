import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";

/**
 * Optional LLM re-rank. Receives transcript TEXT only (never audio or video),
 * returns a title, hook line, 0-100 score and reason per candidate.
 * Any failure returns { ok: false } and the client keeps its heuristic scores.
 */

const MODEL = "google/gemini-2.5-flash";
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 20; // requests per IP per hour
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

const Body = z.object({
  candidates: z
    .array(z.object({ id: z.string().max(64), text: z.string().max(2400) }))
    .min(1)
    .max(20),
});

const Result = z.object({
  clips: z.array(
    z.object({
      id: z.string(),
      title: z.string().describe("Short, curiosity-driven title, max 60 characters, no emojis"),
      hook: z.string().describe("On-screen hook text for the first 3 seconds, max 8 words"),
      score: z.number().min(0).max(100).describe("Likelihood this works as a standalone short video"),
      reason: z.string().describe("One sentence on why, max 18 words"),
    }),
  ),
});

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  try {
    const list = body.candidates.map((c) => `[${c.id}]\n${c.text}`).join("\n\n");
    const { output } = await generateText({
      model: gateway(MODEL),
      output: Output.object({ schema: Result }),
      system:
        "You rate excerpts from long videos as standalone vertical short-form clips (TikTok, Reels, Shorts). Judge the opening hook, whether it is a complete thought, emotional pull and payoff. Be calibrated: most excerpts are average. Return every id you are given.",
      prompt: `Rate each transcript excerpt.\n\n${list}`,
      maxOutputTokens: 2000,
      abortSignal: AbortSignal.timeout(25_000),
    });
    return Response.json({ ok: true, model: MODEL, clips: output.clips });
  } catch (err) {
    console.error("rank failed", err instanceof Error ? err.message : err);
    return Response.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
