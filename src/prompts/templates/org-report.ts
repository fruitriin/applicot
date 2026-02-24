/**
 * ORG 組織レポートプロンプトテンプレート
 *
 * 組織アクター（ORG-*）が組織の状況を報告するためのプロンプト。
 * ORG は自組織の全情報（public + internal + secret）を参照可能。
 * 所属国の国家状態は制限層まで参照可能。
 */

export interface OrgReportContext {
  actorId: string;       // e.g. "ORG-guild"
  orgId: string;         // e.g. "guild"
  sceneNumber: number;
  cycleNumber: number;
  /** ST-ORG-{id} の JSON 全体（public + internal + secret） */
  orgState: string;
  /** HO-PUB の世界観情報 */
  publicHandout: string;
  /** ST-NAT-{nationId}-public と restricted （任意） */
  nationState: string;
  /** RCL-{actorId} の最近の記憶（任意） */
  recentMemory: string;
  /** EDT からの演出指示 */
  directorNote: string;
  /** EDT が指定した活性化派閥 ID リスト（任意） */
  activeFactions?: string[];
}

export function buildOrgReportPrompt(ctx: OrgReportContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const factionNote =
    ctx.activeFactions && ctx.activeFactions.length > 0
      ? "今シーン関連する派閥: " + ctx.activeFactions.join(", ")
      : "（全派閥が通常活動中）";

  const parts: string[] = [];
  parts.push("あなたは「" + ctx.actorId + "」——この組織の意思と動向を体現する存在です。");
  parts.push("組織の内部状況を把握し、今シーンにおける組織の動向レポートを作成してください。");
  parts.push("");
  parts.push("## 世界の基本情報（公開）");
  parts.push(ctx.publicHandout || "（世界情報なし）");
  parts.push("");
  parts.push("## 組織の現在状態（全情報）");
  parts.push(ctx.orgState || "（組織データなし）");
  parts.push("");
  parts.push("## 所属国の状況（公開〜制限層）");
  parts.push(ctx.nationState || "（国家情報なし）");
  parts.push("");
  parts.push("## 組織の直前の記憶");
  parts.push(ctx.recentMemory || "（まだ記憶なし）");
  parts.push("");
  parts.push("## 今シーンの演出指示（EDTより）");
  parts.push(ctx.directorNote);
  parts.push("");
  parts.push("## 今シーン関連派閥");
  parts.push(factionNote);
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("以下の JSON 形式でレポートを出力してください：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push('  "summary": "組織の現在の状況を2〜3文で要約",');
  parts.push('  "factionDynamics": "今シーンで関連する派閥の力学や内部対立",');
  parts.push('  "externalActions": "組織が今シーンで取ろうとしている外部的な行動（任意）",');
  parts.push('  "urgentMatter": "EDT に報告すべき緊急事項（任意）",');
  parts.push('  "orgNote": "AUT・キャラクターへの一行組織サマリー（このシーンの組織的な背景）"');
  parts.push("}");
  parts.push(fence);
  parts.push("");
  parts.push("【制約】");
  parts.push("- secret 情報は組織の内部判断にのみ使用。AUT やキャラクターへは漏らさないこと");
  parts.push("- orgNote は1〜2文の簡潔なサマリー");

  return parts.join("\n");
}
