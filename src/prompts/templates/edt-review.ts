/**
 * EDT レビュープロンプトテンプレート
 *
 * EDT がシーン原稿をレビューし、承認または修正指示を出す。
 */

export interface EdtReviewContext {
  sceneNumber: number;
  cycleNumber: number;
  totalScenes: number;
  directorNote: string;
  dramaticTension: string;
  manuscriptContent: string;
  gmHandout: string;
  foreshadowing: string;
  revisionCount: number;
}

export function buildEdtReviewPrompt(ctx: EdtReviewContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + 'json';
  const parts: string[] = [];

  parts.push('あなたは小説の編集者兼ゲームマスター（EDT）です。');
  parts.push('以下の原稿をレビューし、承認または修正指示を出してください。');
  parts.push('');
  parts.push('## 今シーンの演出指示（あなたが出したもの）');
  parts.push('ディレクターノート: ' + ctx.directorNote);
  parts.push('ドラマティックテンション: ' + ctx.dramaticTension);
  parts.push('');
  parts.push('## GMハンドアウト（非公開設定）');
  parts.push(ctx.gmHandout || '（なし）');
  parts.push('');
  parts.push('## 伏線管理');
  parts.push(ctx.foreshadowing || '（伏線なし）');
  parts.push('');
  parts.push('## レビュー対象の原稿');
  parts.push(fence);
  parts.push(ctx.manuscriptContent);
  parts.push(fence);

  if (ctx.revisionCount > 0) {
    parts.push('');
    parts.push('> 注意: これは修正 ' + ctx.revisionCount + ' 回目の原稿です。大きな問題がなければ承認してください。');
  }

  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('## レビュータスク');
  parts.push('');
  parts.push('以下の観点でレビューし、JSON で結果を出力してください:');
  parts.push('1. 演出指示が原稿に反映されているか');
  parts.push('2. 情報遮断が守られているか（キャラクターが知らないはずの秘密を言っていないか）');
  parts.push('3. ストーリーの整合性が保たれているか');
  parts.push('4. 伏線の扱いが適切か');
  parts.push('');
  parts.push(fenceJson);
  parts.push('{');
  parts.push('  "verdict": "approved または revise",');
  parts.push('  "comments": "修正が必要な場合、具体的な指摘（任意）",');
  parts.push('  "stateUpdates": [');
  parts.push('    {');
  parts.push('      "dataId": "更新すべきデータID",');
  parts.push('      "updateType": "character | relationship | foreshadowing | timeline",');
  parts.push('      "description": "更新内容の説明"');
  parts.push('    }');
  parts.push('  ]');
  parts.push('}');
  parts.push(fence);

  return parts.join('\n');
}
