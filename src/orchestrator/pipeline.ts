/**
 * シーン生成パイプライン — EDT → CHR → AUT → EDT のコアループ
 *
 * planning_doc.md セクション5.1 STEP 1-6 を実装する。
 * MVP: データはプロンプトに直接埋め込み（MCP 経由読み取りは Phase 2）
 */

import type {
  CycleContext,
  SceneResult,
  ScenePrompt,
  ActionProposal,
  SceneManuscript,
  ReviewResult,
} from "./types.js";
import type { ActorId } from "../core/types/ids.js";
import { actorTypeFromId } from "../core/types/ids.js";
import { createStore } from "../core/store/store.js";
import {
  buildActorPrompt,
  buildEdtReviewPromptFromStore,
  buildAutRevisePromptFromStore,
} from "../prompts/builder.js";
import { runActorSession } from "../runner/actor.js";

const MAX_REVISION_CYCLES = 3;

/** JSON 文字列からオブジェクトを抽出する */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try { return JSON.parse(trimmed); } catch { /* ignore */ }
  const jsonFence = new RegExp("```(?:json)?\s*\n([\s\S]*?)\n```");
  const match = trimmed.match(jsonFence);
  if (match && match[1]) return JSON.parse(match[1].trim());
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) return JSON.parse(objMatch[0]);
  throw new Error("Cannot extract JSON from: " + trimmed.slice(0, 300));
}

/** Markdown テキストをコードフェンスから抽出する */
function extractMarkdown(text: string): string {
  const trimmed = text.trim();
  const mdFence = new RegExp("```(?:markdown)?\s*\n([\s\S]*?)\n```");
  const match = trimmed.match(mdFence);
  if (match && match[1]) return match[1].trim();
  return trimmed;
}
/**
 * 1シーン分の生成パイプラインを実行する
 */
export async function executeScenePipeline(
  sceneNumber: number,
  ctx: CycleContext,
): Promise<SceneResult> {
  const scenePrompt = await runEdtDesign(sceneNumber, ctx);
  const actionProposals = await runCharacterProposals(scenePrompt, ctx);
  let manuscript = await runAuthorWrite(scenePrompt, actionProposals, ctx);
  let review: ReviewResult = { verdict: "approved" };
  let revisionCount = 0;
  for (let i = 0; i < MAX_REVISION_CYCLES; i++) {
    review = await runEdtReview(manuscript, scenePrompt, ctx);
    if (review.verdict === "approved") break;
    revisionCount++;
    manuscript = await runAuthorRevise(manuscript, review, scenePrompt, actionProposals, ctx, revisionCount);
  }
  return { scenePrompt, actionProposals, manuscript, review, revisionCount };
}

async function runEdtDesign(sceneNumber: number, ctx: CycleContext): Promise<ScenePrompt> {
  const store = createStore({ novelRoot: ctx.novelDir });
  const prompt = await buildActorPrompt({
    actorId: "EDT" as ActorId,
    novelDir: ctx.novelDir,
    sceneNumber,
    cycleNumber: ctx.cycleNumber,
    totalScenes: ctx.totalScenes,
    store,
  });

  const { content } = await runActorSession({
    novelDir: ctx.novelDir,
    actorId: "EDT" as ActorId,
    prompt,
  });

  const json = extractJson(content) as {
    directorNote: string;
    activatedActors: string[];
    dramaticTension: string;
  };

  return {
    sceneNumber,
    cycleNumber: ctx.cycleNumber,
    directorNote: json.directorNote,
    activatedActors: json.activatedActors as ActorId[],
    dramaticTension: json.dramaticTension,
  };
}
async function runCharacterProposals(
  scenePrompt: ScenePrompt,
  ctx: CycleContext,
): Promise<ActionProposal[]> {
  const store = createStore({ novelRoot: ctx.novelDir });
  const chrActors = scenePrompt.activatedActors.filter(
    function(id) { return actorTypeFromId(id) === "CHR"; }
  );

  const proposals = await Promise.all(
    chrActors.map(async function(actorId) {
      const prompt = await buildActorPrompt(
        {
          actorId,
          novelDir: ctx.novelDir,
          sceneNumber: scenePrompt.sceneNumber,
          cycleNumber: ctx.cycleNumber,
          totalScenes: ctx.totalScenes,
          store,
        },
        scenePrompt,
      );

      const { content } = await runActorSession({
        novelDir: ctx.novelDir,
        actorId,
        prompt,
      });

      const json = extractJson(content) as {
        actionType: "dialogue" | "action" | "thought" | "reaction";
        content: string;
        internalReason: string;
        citations: string[];
      };

      const proposal: ActionProposal = {
        actorId,
        content: json.content,
        actionType: json.actionType,
        citations: json.citations ?? [],
        metadata: { internalReason: json.internalReason },
      };
      return proposal;
    }),
  );

  return proposals;
}
async function runAuthorWrite(
  scenePrompt: ScenePrompt,
  actionProposals: ActionProposal[],
  ctx: CycleContext,
): Promise<SceneManuscript> {
  const store = createStore({ novelRoot: ctx.novelDir });
  const prompt = await buildActorPrompt(
    {
      actorId: "AUT" as ActorId,
      novelDir: ctx.novelDir,
      sceneNumber: scenePrompt.sceneNumber,
      cycleNumber: ctx.cycleNumber,
      totalScenes: ctx.totalScenes,
      store,
    },
    scenePrompt,
    { actionProposals },
  );

  const { content } = await runActorSession({
    novelDir: ctx.novelDir,
    actorId: "AUT" as ActorId,
    prompt,
  });

  return {
    actorId: "AUT" as ActorId,
    content,
    sceneNumber: scenePrompt.sceneNumber,
    cycleNumber: scenePrompt.cycleNumber,
    markdownContent: extractMarkdown(content),
  };
}
async function runEdtReview(
  manuscript: SceneManuscript,
  scenePrompt: ScenePrompt,
  ctx: CycleContext,
): Promise<ReviewResult> {
  const store = createStore({ novelRoot: ctx.novelDir });
  const buildCtx = {
    actorId: "EDT" as ActorId,
    novelDir: ctx.novelDir,
    sceneNumber: scenePrompt.sceneNumber,
    cycleNumber: ctx.cycleNumber,
    totalScenes: ctx.totalScenes,
    store,
  };

  const prompt = await buildEdtReviewPromptFromStore(
    buildCtx,
    manuscript,
    scenePrompt,
    0,
  );

  const { content } = await runActorSession({
    novelDir: ctx.novelDir,
    actorId: "EDT" as ActorId,
    prompt,
  });

  const json = extractJson(content) as {
    verdict: "approved" | "revise";
    comments?: string;
    stateUpdates?: ReviewResult['stateUpdates'];
  };

  return {
    verdict: json.verdict,
    comments: json.comments,
    stateUpdates: json.stateUpdates,
  };
}
async function runAuthorRevise(
  original: SceneManuscript,
  review: ReviewResult,
  scenePrompt: ScenePrompt,
  actionProposals: ActionProposal[],
  ctx: CycleContext,
  revisionCount: number,
): Promise<SceneManuscript> {
  const store = createStore({ novelRoot: ctx.novelDir });
  const buildCtx = {
    actorId: "AUT" as ActorId,
    novelDir: ctx.novelDir,
    sceneNumber: scenePrompt.sceneNumber,
    cycleNumber: ctx.cycleNumber,
    totalScenes: ctx.totalScenes,
    store,
  };

  const prompt = await buildAutRevisePromptFromStore(
    buildCtx,
    scenePrompt,
    actionProposals,
    original,
    review,
  );

  const { content } = await runActorSession({
    novelDir: ctx.novelDir,
    actorId: "AUT" as ActorId,
    prompt,
  });

  return {
    actorId: "AUT" as ActorId,
    content,
    sceneNumber: scenePrompt.sceneNumber,
    cycleNumber: scenePrompt.cycleNumber,
    markdownContent: extractMarkdown(content),
  };
}