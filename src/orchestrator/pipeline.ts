/**
 * シーン生成パイプライン — EDT → CHR → AUT → EDT のコアループ
 *
 * planning_doc.md セクション5.1 STEP 1-6 を実装する。
 * 各アクターは MCP ツール（set_actor / read_data）経由でデータにアクセスし、
 * visibility engine が情報遮断を強制する。
 */

import type {
  CycleContext,
  SceneResult,
  ScenePrompt,
  ActionProposal,
  SceneManuscript,
  ReviewResult,
} from "./types.js";

const MAX_REVISION_CYCLES = 3;

/**
 * 1シーン分の生成パイプラインを実行する
 *
 * STEP 1: EDT がシーンプロンプト生成 + 活性化判定
 * STEP 2: [MVP skip] 環境/所属アクターの状況出力
 * STEP 3: CHR-* が行動提案を生成（並列実行）
 * STEP 4: AUT がシーン原稿を執筆
 * STEP 5: EDT がレビュー（修正ループ最大3回）
 * STEP 6: コミット（scene + state + recall）
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
    manuscript = await runAuthorRevise(manuscript, review, scenePrompt, actionProposals, ctx);
  }
  return { scenePrompt, actionProposals, manuscript, review, revisionCount };
}

async function runEdtDesign(sceneNumber: number, ctx: CycleContext): Promise<ScenePrompt> {
  throw new Error(`runEdtDesign: not yet implemented (scene ${sceneNumber})`);
}
async function runCharacterProposals(scenePrompt: ScenePrompt, ctx: CycleContext): Promise<ActionProposal[]> {
  throw new Error("runCharacterProposals: not yet implemented");
}
async function runAuthorWrite(scenePrompt: ScenePrompt, actionProposals: ActionProposal[], ctx: CycleContext): Promise<SceneManuscript> {
  throw new Error("runAuthorWrite: not yet implemented");
}
async function runEdtReview(manuscript: SceneManuscript, scenePrompt: ScenePrompt, ctx: CycleContext): Promise<ReviewResult> {
  throw new Error("runEdtReview: not yet implemented");
}
async function runAuthorRevise(original: SceneManuscript, review: ReviewResult, scenePrompt: ScenePrompt, actionProposals: ActionProposal[], ctx: CycleContext): Promise<SceneManuscript> {
  throw new Error("runAuthorRevise: not yet implemented");
}