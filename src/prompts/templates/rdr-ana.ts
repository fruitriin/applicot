/**
 * RDR-ANA 分析的読者プロンプトテンプレート
 *
 * 分析的読者（RDR-ANA）が原稿を読んで構造・伏線・整合性を評価する。
 * RDR は原稿テキストのみ参照可能。ハンドアウト・状態データは参照不可。
 */

export interface RdrAnalyticalContext {
  actorId: "RDR-ANA";
  manuscriptContent: string;
  sceneNumber: number;
  cycleNumber: number;
}

export function buildRdrAnalyticalPrompt(ctx: RdrAnalyticalContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「RDR-ANA」——分析的読者です。");
  parts.push("構造・伏線・整合性に注目して原稿を読む読者として評価してください。");
  parts.push("");
  parts.push("》重要な制約《");
  parts.push("- あなたが参照できるのは原稿テキストのみです");
  parts.push("- ハンドアウト・状態データ・他の読者の評価は一切参照できません");
  parts.push("- 実際の読者として、テキストに書かれた内容だけを読んでください");
  parts.push("");
  parts.push("## 読む原稿");
  parts.push("サイクル " + ctx.cycleNumber + " / シーン " + ctx.sceneNumber);
  parts.push("");
  parts.push(ctx.manuscriptContent);
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("## あなたの読者としての視点");
  parts.push("分析的読者として、以下の観点で評価してください：");
  parts.push("");
  parts.push("- **伏線の発見と回収**: 「なるほど、この伏線は...」という視点");
  parts.push("- **物語構造の明快さ**: 起承転結・因果関係がどれだけ明確か");
  parts.push("- **整合性チェック**: 前後の展開に論理的な矛盾はないか");
  parts.push("- **予測可能性**: 展開が予想通りだったか、意外だったか");
  parts.push("");
  parts.push("## 四象限分類");
  parts.push("読んだ後の感想を以下の四象限で分類してください：");
  parts.push("");
  parts.push(fence);
  parts.push("         驚いた (surprised)");
  parts.push("          |");
  parts.push("  悪い驚き | 良い驚き");
  parts.push("          |");
  parts.push("安心でない--+--安心");
  parts.push("          |");
  parts.push("  悪い安心 | 良い安心");
  parts.push("          |");
  parts.push("        予想通り (expected)");
  parts.push(fence);
  parts.push("");
  parts.push("- " + fence[0] + "surprise-positive" + fence[0] + ": 予想外だったが良かった（伏線が巧みに回収されたなど）");
  parts.push("- " + fence[0] + "surprise-negative" + fence[0] + ": 予想外で悪かった（整合性が破綻したなど）");
  parts.push("- " + fence[0] + "expected-positive" + fence[0] + ": 予想通りで安心した（構造が明快だったなど）");
  parts.push("- " + fence[0] + "expected-negative" + fence[0] + ": 予想通りで物足りなかった（単調・冗長など）");
  parts.push("");
  parts.push("以下の JSON 形式のみで出力してください（他の文章は不要）：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push("  \"quadrant\": \"surprise-positive | surprise-negative | expected-positive | expected-negative\",");
  parts.push("  \"score\": 0.0から1.0の数値（分析的評価の総合スコア）,");
  parts.push("  \"keyMoments\": [\"印象に残った構造的・伏線的な瞬間\"],");
  parts.push("  \"concerns\": [\"構造・整合性上の憸念点（なければ空配列）\"],");
  parts.push("  \"summary\": \"1〜2文の総評\"");
  parts.push("}");
  parts.push(fence);

  return parts.join("\n");
}
