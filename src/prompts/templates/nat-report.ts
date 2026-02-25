/**
 * NAT 国家レポートプロンプトテンプレート
 *
 * 国家アクター（NAT-*）が国家の状況を報告するためのプロンプト。
 * NAT は自国の全3層（public + restricted + secret）を参照可能。
 * 他国の公開層と、配下組織の全情報を参照可能。
 */

export interface NatReportContext {
  actorId: string;       // e.g. "NAT-england"
  natId: string;         // e.g. "england"
  sceneNumber: number;
  cycleNumber: number;
  /** ST-NAT-{id}-public の内容 */
  ownPublicLayer: string;
  /** ST-NAT-{id}-restricted の内容 */
  ownRestrictedLayer: string;
  /** ST-NAT-{id}-secret の内容 */
  ownSecretLayer: string;
  /** 他国の公開層サマリー（任意） */
  otherNationsPublic: string;
  /** 配下組織の状態（任意） */
  subordinateOrgs: string;
  /** HO-PUB の世界観情報 */
  publicHandout: string;
  /** RCL-{actorId} の最近の記憶（任意） */
  recentMemory: string;
  /** EDT からの演出指示 */
  directorNote: string;
  /** 戦時フラグ（trueの場合は軍事セクションを強化） */
  isWartime?: boolean;
  /** 戦時の場合: 交戦国・戦線状況 */
  warStatus?: string;
}

export function buildNatReportPrompt(ctx: NatReportContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「" + ctx.actorId + "」——この国家の意思と動向を体現する存在です。");
  parts.push("国家の全情報を把握した上で、今シーンにおける国家の動向レポートを作成してください。");
  parts.push("");
  parts.push("## 世界の基本情報（公開）");
  parts.push(ctx.publicHandout || "（世界情報なし）");
  parts.push("");
  parts.push("## 自国の公開情報");
  parts.push(ctx.ownPublicLayer || "（公開層データなし）");
  parts.push("");
  parts.push("## 自国の制限情報（国民・政府内部）");
  parts.push(ctx.ownRestrictedLayer || "（制限層データなし）");
  parts.push("");
  parts.push("## 自国の秘密情報（最高機密）");
  parts.push(ctx.ownSecretLayer || "（秘密層データなし）");
  parts.push("");
  parts.push("## 他国の公開情報");
  parts.push(ctx.otherNationsPublic || "（他国情報なし）");
  parts.push("");
  parts.push("## 配下組織の状況");
  parts.push(ctx.subordinateOrgs || "（配下組織情報なし）");
  parts.push("");
  parts.push("## 国家の直前の記憶");
  parts.push(ctx.recentMemory || "（まだ記憶なし）");
  parts.push("");
  parts.push("## 今シーンの演出指示（EDTより）");
  parts.push(ctx.directorNote);
  parts.push("");
  if (ctx.isWartime) {
    parts.push("## ⚔️ 戦時状態");
    parts.push(ctx.warStatus || "（戦線情報なし）");
    parts.push("");
    parts.push("【戦時特殊指示】");
    parts.push("- 現在は戦時状態です。軍事行動・外交交渉を最優先で報告してください");
    parts.push("- militaryPosture は通常より詳細に（前線の動向・補給状況・指揮系統を含む）");
    parts.push("- 毎シーン更新が必要です");
    parts.push("");
  }
  parts.push("---");
  parts.push("");
  parts.push("以下の JSON 形式でレポートを出力してください：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push('  "policyUpdate": "現在の国家政策・方針を2〜3文で要約",');
  parts.push('  "militaryPosture": "軍事的な動向・配置・脅威認識",');
  parts.push('  "diplomaticActions": "外交的な動向・交渉・姿勢",');
  parts.push('  "urgentMatter": "EDT に報告すべき緊急事項（任意）",');
  parts.push('  "wartimeActions": "戦時の場合のみ: 今シーンの軍事的決定・作戦（平時はnull）",');
  parts.push('  "natNote": "AUT・キャラクターへの一行国家サマリー（このシーンの政治的な背景）"');
  parts.push("}");
  parts.push(fence);
  parts.push("");
  parts.push("【制約】");
  parts.push("- secret 層は国家の内部判断にのみ使用。AUT やキャラクターへは漏らさないこと");
  parts.push("- natNote は1〜2文の簡潔なサマリー");
  if (ctx.isWartime) {
    parts.push("- 戦時: wartimeActions に今シーンの具体的軍事行動を記録すること");
  }

  return parts.join("\n");
}
