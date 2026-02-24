import type { ActorId } from '../core/types/ids.js';

// --- シーン生成パイプライン型定義 ---

/** アクターの出力 */
export interface ActorOutput {
  actorId: ActorId;
  content: string;
  metadata?: Record<string, unknown>;
}

/** 行動提案（CHR アクターの出力） */
export interface ActionProposal extends ActorOutput {
  actionType: "dialogue" | "action" | "thought" | "reaction";
  citations: string[]; // 引用したハンドアウト/状態のDataId
}

/** シーン原稿（AUT アクターの出力） */
export interface SceneManuscript extends ActorOutput {
  sceneNumber: number;
  cycleNumber: number;
  markdownContent: string;
}

/** EDT のシーン設計出力 */
export interface ScenePrompt {
  sceneNumber: number;
  cycleNumber: number;
  directorNote: string;       // EDT からの演出指示
  activatedActors: ActorId[]; // 今シーンで活性化するアクター
  dramaticTension: string;    // 今シーンで高めるべき緊張感
}

/** EDT のレビュー結果 */
export interface ReviewResult {
  verdict: "approved" | "revise";
  comments?: string;
  stateUpdates?: StateUpdateInstruction[];
}

/** 状態更新指示（EDT → 確定後処理） */
export interface StateUpdateInstruction {
  dataId: string;
  updateType: "character" | "relationship" | "foreshadowing" | "timeline";
  description: string;
}

/** シーン生成の結果（コミット前の集約） */
export interface SceneResult {
  scenePrompt: ScenePrompt;
  actionProposals: ActionProposal[];
  manuscript: SceneManuscript;
  review: ReviewResult;
  revisionCount: number;
  envReport?: EnvReport;
}

/** ENV アクターの環境レポート */
export interface EnvObservable {
  weather: string;
  temperature: string;
  timeOfDay: string;
  notableEvents: string[];
}

export interface EnvReport extends ActorOutput {
  observable: EnvObservable;
  nonObservable: {
    climateTrend?: string;
    ecologicalShift?: string;
    tectonicActivity?: string;
  };
  envNote: string;
}

/** サイクル全体のコンテキスト */
export interface CycleContext {
  novelDir: string;           // novel/ ディレクトリへの絶対パス
  cycleNumber: number;
  totalScenes: number;        // MVP: 4 (起承転結)
  completedScenes: number;
}
