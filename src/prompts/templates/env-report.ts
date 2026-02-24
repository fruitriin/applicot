/**
 * ENV 環境レポートプロンプトテンプレート
 *
 * 環境アクター（ENV）が現在の環境状況を報告するためのプロンプト。
 * ENV は ST-ENV（環境状態）と HO-PUB（公開情報）を参照可能。
 * 観測不可能なパターン（長期気候変動等）は ENV のみが把握する。
 */

export interface EnvReportContext {
  sceneNumber: number;
  cycleNumber: number;
  /** ST-ENV の JSON 文字列 */
  environmentState: string;
  /** HO-PUB の世界観情報 */
  publicHandout: string;
  /** RCL-ENV の最近の記憶（任意） */
  recentMemory: string;
  /** EDT からの演出指示 */
  directorNote: string;
}

export function buildEnvReportPrompt(ctx: EnvReportContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「ENV」――この物語世界の環境を司る存在です。");
  parts.push(
    "天候・気温・時刻・自然現象を観察し、物語の場を整えるレポートを作成してください。",
  );
  parts.push('');
  parts.push("## 世界の基本情報（公開）");
  parts.push(ctx.publicHandout || "（世界情報なし）");
  parts.push('');
  parts.push("## 現在の環境状態");
  parts.push(ctx.environmentState || "（環境データなし）");
  parts.push('');
  parts.push("## 直前の環境記憶");
  parts.push(ctx.recentMemory || "（まだ記憶なし）");
  parts.push('');
  parts.push("## 今シーンの演出指示（EDTより）");
  parts.push(ctx.directorNote);
  parts.push('');
  parts.push("---");
  parts.push('');
  parts.push("以下の JSON 形式でレポートを出力してください：");
  parts.push('');
  parts.push(fenceJson);
  parts.push('{');
  parts.push('  "observable": {');
  parts.push('    "weather": "天候の描写",');
  parts.push('    "temperature": "体感気温",');
  parts.push('    "timeOfDay": "時刻帯",');
  parts.push('    "notableEvents": ["注目すべき自然現象1", "..."]');
  parts.push('  },');
  parts.push('  "nonObservable": {');
  parts.push('    "climateTrend": "長期的な気候トレンド（オプション）",');
  parts.push('    "ecologicalShift": "生態系の変化（オプション）",');
  parts.push('    "tectonicActivity": "地殻変動（オプション）"');
  parts.push('  },');
  parts.push('  "envNote": "AUT・キャラクターへの一行環境サマリー（このシーンの環境的な特徴）"');
  parts.push('}');
  parts.push(fence);
  parts.push('');
  parts.push("【制約】");
  parts.push("- observable は今シーンにいる全キャラクターが感知できる情報");
  parts.push(
    "- nonObservable は ENV のみが知る長期パターン（AUT・CHR には見えない）",
  );
  parts.push("- envNote は1～2文の簡潔なサマリー");

  return parts.join("\n");
}
