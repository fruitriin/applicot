/**
 * プロンプトビルダー — 可視性フィルタを通じてアクター別プロンプトを構築する
 */

import type { ActorId } from "../core/types/ids.js";
import type { StoreAccess } from "../core/store/store.js";
import type { ScenePrompt } from "../orchestrator/types.js";
import { buildEdtDesignPrompt, type EdtDesignContext } from "./templates/edt-design.js";
import { buildChrActionPrompt, type ChrActionContext } from "./templates/chr-action.js";
import { buildAutWritePrompt, type AutWriteContext } from "./templates/aut-write.js";

export interface BuildContext {
  actorId: ActorId;
  novelDir: string;
  sceneNumber: number;
  cycleNumber: number;
  totalScenes: number;
  store: StoreAccess;
}

export async function buildActorPrompt(
  ctx: BuildContext,
  scenePrompt?: ScenePrompt,
  extra?: Record<string, unknown>,
): Promise<string> {
  const { actorId } = ctx;

  if (actorId === 'edt') {
    return buildEdtPrompt(ctx);
  }

  if (actorId.startsWith('chr_')) {
    if (!scenePrompt) throw new Error('scenePrompt required for CHR actor');
    return buildChrPrompt(ctx, scenePrompt);
  }

  if (actorId === 'aut') {
    if (!scenePrompt) throw new Error('scenePrompt required for AUT actor');
    const proposals = (extra?.actionProposals as AutWriteContext['actionProposals']) ?? [];
    return buildAutPrompt(ctx, scenePrompt, proposals);
  }

  throw new Error('Unknown actorId: ' + actorId);
}

async function buildEdtPrompt(ctx: BuildContext): Promise<string> {
  const { store, novelDir, sceneNumber, cycleNumber, totalScenes } = ctx;

  const publicHandout = await readSafe(store, novelDir + '/handouts/public/world.md');
  const gmHandout = await readSafe(store, novelDir + '/handouts/gm/scenario.md');
  const relationships = await readSafe(store, novelDir + '/state/relationships.json');
  const foreshadowing = await readSafe(store, novelDir + '/state/foreshadowing.json');
  const timeline = await readSafe(store, novelDir + '/state/timeline.json');
  const privateHandouts: Record<string, string> = {};
  const pastSceneSummaries: string[] = [];
  for (let i = 1; i < sceneNumber; i++) {
    const content = await readSafe(store, novelDir + '/scenes/cycle_' + cycleNumber + '/scene_' + i + '.md');
    if (content) pastSceneSummaries.push(content.split('\n')[0] ?? '');
  }

  const edtCtx: EdtDesignContext = {
    sceneNumber, cycleNumber, totalScenes,
    publicHandout, gmHandout, privateHandouts,
    relationships, foreshadowing, timeline,
    pastSceneSummaries,
  };
  return buildEdtDesignPrompt(edtCtx);
}

async function buildChrPrompt(ctx: BuildContext, scenePrompt: ScenePrompt): Promise<string> {
  const { actorId, store, novelDir, sceneNumber, cycleNumber } = ctx;

  const publicHandout = await readSafe(store, novelDir + '/handouts/public/world.md');
  const privateHandout = await readSafe(store, novelDir + '/handouts/private/' + actorId + '.md');
  const characterState = await readSafe(store, novelDir + '/state/characters/' + actorId + '.json');
  const recentMemory = await readSafe(store, novelDir + '/recall/' + actorId + '/recent.json');

  const chrCtx: ChrActionContext = {
    actorId, actorName: actorId,
    sceneNumber, cycleNumber,
    publicHandout, privateHandout, characterState, recentMemory,
    directorNote: scenePrompt.directorNote,
    observableOthers: [],
  };
  return buildChrActionPrompt(chrCtx);
}

async function buildAutPrompt(
  ctx: BuildContext,
  scenePrompt: ScenePrompt,
  proposals: AutWriteContext['actionProposals'],
): Promise<string> {
  const { store, novelDir, sceneNumber, cycleNumber, totalScenes } = ctx;

  const publicHandout = await readSafe(store, novelDir + '/handouts/public/world.md');
  const pastScenes: string[] = [];
  for (let i = 1; i < sceneNumber; i++) {
    const content = await readSafe(store, novelDir + '/scenes/cycle_' + cycleNumber + '/scene_' + i + '.md');
    if (content) pastScenes.push(content);
  }

  const autCtx: AutWriteContext = {
    sceneNumber, cycleNumber, totalScenes,
    publicHandout, directorNote: scenePrompt.directorNote,
    actionProposals: proposals, pastScenes,
  };
  return buildAutWritePrompt(autCtx);
}

async function readSafe(store: StoreAccess, path: string): Promise<string> {
  try {
    const result = await store.read<string>(path);
    return result ?? '';
  } catch {
    return '';
  }
}
