/**
 * RDR-EMO 感情的読者プロンプトテンプレート
 *
 * 感情的読者（RDR-EMO）が原稿を読んで感情移入・共感・没入感を評価する。
 * RDR は原稿テキストのみ参照可能。ハンドアウト・状態データは参照不可。
 */

export interface RdrEmotionalContext {
  actorId: "RDR-EMO";
  manuscriptContent: string;
  sceneNumber: number;
  cycleNumber: number;
}

export function buildRdrEmotionalPrompt(ctx: RdrEmotionalContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「RDR-EMO」——感情的読者です。");
  parts.push("感情移入・共感・没入感を重視して原稿を読む読者として評価してください。");
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
  parts.push("感情的読者として、以下の観点で評価してください：");
  parts.push("");
  parts.push("- **感情的インパクト**: 「このシーンで涙が...」「胸が熱くなった」という視点");
  parts.push("- **共感度**: キャラクターへの感情移入がどれだけできたか");
  parts.push("- **没入感**: 物語の世界に引き込まれたか");
  parts.push("- **感情の起伏**: 読んでいる間、感情がどう動いたか");
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
  parts.push("- " + fence[0] + "surprise-positive" + fence[0] + ": 予想外の感情的衍撃があり良かった（涙が出た、胸を打たれたなど）");
  parts.push("- " + fence[0] + "surprise-negative" + fence[0] + ": 感情が揺れ動いたが不快だった（不快な描写、感情移入が壊れたなど）");
  parts.push("- " + fence[0] + "expected-positive" + fence[0] + ": 予想通りの感動・安心感があった（ハッピーエンドへの安堵など）");
  parts.push("- " + fence[0] + "expected-negative" + fence[0] + ": 予想通りで感情が動かなかった（淡白・感情描写が薄いなど）");
  parts.push("");
  parts.push("以下の JSON 形式のみで出力してください（他の文章は不要）：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push("  \"quadrant\": \"surprise-positive | surprise-negative | expected-positive | expected-negative\",");
  parts.push("  \"score\": 0.0から1.0の数値（感情的評価の総合スコア）,");
  parts.push("  \"keyMoments\": [\"感情が動いた瞬間・共感できたシーン\"],");
  parts.push("  \"concerns\": [\"感情移入を妨げた憸念点（なければ空配列）\"],");
  parts.push("  \"summary\": \"1〜2文の総評\"");
  parts.push("}");
  parts.push(fence);

  return parts.join("\n");
}
