/**
 * Commit message helpers for applicot novel repository.
 *
 * Provides typed, consistent commit message generation for
 * special commit types: disclosure stage transitions, handout moves,
 * recall writes, and scene outputs.
 */

export type CommitType =
  | "disclosure"
  | "handout"
  | "recall"
  | "scene"
  | "state"
  | "config";

export interface DisclosureCommitParams {
  secretId: string;
  fromStage: string;
  toStage: string;
  summary: string;
  trigger?: string;
}

export interface HandoutCommitParams {
  handoutId: string;
  action: "create" | "publish" | "update" | "archive";
  description?: string;
}

export interface RecallCommitParams {
  actorId: string;
  layer: string;
  sceneId: string;
  entryCount: number;
}

export interface SceneCommitParams {
  cycleId: string | number;
  sceneId: string | number;
  summary?: string;
}

export function formatDisclosureCommit(params: DisclosureCommitParams): string {
  const { secretId, fromStage, toStage, summary, trigger } = params;
  let msg = `disclosure: ${secretId} ${fromStage} → ${toStage} — ${summary}`;
  if (trigger) {
    msg += `\n\nTrigger: ${trigger}`;
  }
  return msg;
}

export function formatHandoutCommit(params: HandoutCommitParams): string {
  const { handoutId, action, description } = params;
  const base = `handout(${action}): ${handoutId}`;
  return description ? `${base} — ${description}` : base;
}

export function formatRecallCommit(params: RecallCommitParams): string {
  const { actorId, layer, sceneId, entryCount } = params;
  const plural = entryCount === 1 ? "entry" : "entries";
  return `recall(${actorId}): scene ${sceneId} — ${layer} layer, ${entryCount} ${plural}`;
}

export function formatSceneCommit(params: SceneCommitParams): string {
  const { cycleId, sceneId, summary } = params;
  const base = `scene: cycle ${cycleId} scene ${sceneId}`;
  return summary ? `${base}: ${summary}` : base;
}
