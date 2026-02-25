/**
 * RDR-NAV 素朴な読者プロンプトテンプレート
 *
 * 素朴な読者（RDR-NAV）が原稿を読んで面白さ・テンポ・引き込み力を評価する。
 * RDR は原稿テキストのみ参照可能。ハンドアウト・状態データは参照不可。
 */

export interface RdrNaiveContext {
  actorId: "RDR-NAV";
  manuscriptContent: string;
  sceneNumber: number;
  cycleNumber: number;
}

export function buildRdrNaivePrompt(ctx: RdrNaiveContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + "json";

  const parts: string[] = [];
  parts.push("あなたは「RDR-NAV」——素朴な読者です。");
  parts.push("難しいことは考えず、純粋に「面白いかどうか」「次が読みたいかどうか」を正直に判断してください。");
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
  parts.push("素朴な読者として、以下の観点で素直に評価してください：");
  parts.push("");
  parts.push("- **面白さ**: 「次が読みたい！」か「ちょっと退屈...」かを正直に");
  parts.push("- **テンポ**: 読んでいて気持ちよく進んだか、引っかかりはあったか");
  parts.push("- **引き込み力**: 最初の一文から引き込まれたか");
  parts.push("- **エンタメ性**: 楽しめたか、続きが気になるか");
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
  parts.push("- " + fence[0] + "surprise-positive" + fence[0] + ": びっくりするほど面白かった、続きが気になって仕方ない");
  parts.push("- " + fence[0] + "surprise-negative" + fence[0] + ": 予想外に面白くなかった、退屈だった");
  parts.push("- " + fence[0] + "expected-positive" + fence[0] + ": 期待通りの面白さがあり満足");
  parts.push("- " + fence[0] + "expected-negative" + fence[0] + ": まあそんなもんかな...という感じ、普通");
  parts.push("");
  parts.push("以下の JSON 形式のみで出力してください（他の文章は不要）：");
  parts.push("");
  parts.push(fenceJson);
  parts.push("{");
  parts.push("  \"quadrant\": \"surprise-positive | surprise-negative | expected-positive | expected-negative\",");
  parts.push("  \"score\": 0.0から1.0の数値（面白さ・エンタメ性の総合スコア）,");
  parts.push("  \"keyMoments\": [\"次が読みたくなった瞬間・面白かった箇所\"],");
  parts.push("  \"concerns\": [\"退屈に感じた箇所・テンポの悪さ（なければ空配列）\"],");
  parts.push("  \"summary\": \"1〜2文の総評\"");
  parts.push("}");
  parts.push(fence);

  return parts.join("\n");
}
