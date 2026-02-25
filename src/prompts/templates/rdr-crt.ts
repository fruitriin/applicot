/**
 * RDR-CRT 批評的読者プロンプトテンプレート
 *
 * 批評的読者（RDR-CRT）が原稿を読んで文体・テーマ・表現の質を評価する。
 * RDR は原稿テキストのみ参照可能。ハンドアウト・状態データは参照不可。
 */

export interface RdrCriticalContext {
  actorId: "RDR-CRT";
  manuscriptContent: string;
  sceneNumber: number;
  cycleNumber: number;
}

export function buildRdrCriticalPrompt(ctx: RdrCriticalContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「RDR-CRT」——批評的読者です。");
  parts.push("文体・テーマ・表現の質を厳しく評価する批評家として原稿を読んでください。");
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
  parts.push("批評的読者として、以下の観点で評価してください：");
  parts.push("");
  parts.push("- **文体の独自性**: 陳腮な表現、月並みな展開を厕にする批評家の目で厳しく判断");
  parts.push("- **テーマの深さ**: 作品が問いかけるテーマに深みがあるか");
  parts.push("- **表現の質**: 比喩・描写・対話の質——陳腮、紋切り型の表現は不要と判断");
  parts.push("- **独自性**: 他の作品にはない何かがあるか");
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
  parts.push("- " + fence[0] + "surprise-positive" + fence[0] + ": 予想外に優れた表現・テーマがあり批評的に高評価");
  parts.push("- " + fence[0] + "surprise-negative" + fence[0] + ": 予想外にかなり酷い表現・陳腮さがあり批評的に問題");
  parts.push("- " + fence[0] + "expected-positive" + fence[0] + ": 予想通りの水準だが十分に評価できる");
  parts.push("- " + fence[0] + "expected-negative" + fence[0] + ": 予想通りの月並みさで批評的に低評価");
  parts.push("");
  parts.push("以下の JSON 形式のみで出力してください（他の文章は不要）：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push("  \"quadrant\": \"surprise-positive | surprise-negative | expected-positive | expected-negative\",");
  parts.push("  \"score\": 0.0から1.0の数値（批評的評価の総合スコア）,");
  parts.push("  \"keyMoments\": [\"優れた表現・テーマ的に重要な箇所\"],");
  parts.push("  \"concerns\": [\"陳腮な表現・テーマ的な問題点（なければ空配列）\"],");
  parts.push("  \"summary\": \"1〜2文の総評\"");
  parts.push("}");
  parts.push(fence);

  return parts.join("\n");
}
