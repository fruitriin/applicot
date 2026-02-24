import type { ActorId } from "../core/types/ids.js";

export interface ActorRunInput {
  novelDir: string;
  actorId: ActorId;
  prompt: string;
}

export interface ActorRunResult {
  content: string;
}

export async function runActorSession(input: ActorRunInput): Promise<ActorRunResult> {
  const proc = Bun.spawn(
    ["claude", "--dangerously-skip-permissions", "-p", input.prompt, "--output-format", "json"],
    { cwd: input.novelDir, stdout: "pipe", stderr: "pipe" },
  );
  const raw = await new Response(proc.stdout).text();
  await proc.exited;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { content: raw.trim() };
  }

  const outer = parsed as Record<string, unknown>;
  const result = typeof outer.result === "string" ? outer.result : raw;

  return { content: result };
}
