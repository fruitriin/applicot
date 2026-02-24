/**
 * AUT 修正プロンプトテンプレート
 *
 * EDT のレビューコメントをもとに、AUT がシーン原稿を書き直す。
 */

export interface AutReviseContext {
  sceneNumber: number;
  cycleNumber: number;
  totalScenes: number;
  publicHandout: string;
  directorNote: string;
  actionProposals: Array<{
    actorId: string;
    actorName: string;
    actionType: string;
    content: string;
  }>;
  originalManuscript: string;
  reviewComments: string;
  revisionCount: number;
}

export function buildAutRevisePrompt(ctx: AutReviseContext): string {
  const sceneLabel = getSceneLabel(ctx.sceneNumber, ctx.totalScenes);
  const fence = String.fromCharCode(96).repeat(3);
  const fenceMarkdown = fence + 'markdown';

  const proposals = ctx.actionProposals
    .map(
      (p) =>
        '### ' +
        p.actorName +
        '(' + p.actorId + ')' +
        '\n' +
        '行動タイプ: ' + p.actionType + '\n' + p.content
    )
    .join('\n\n');

  const parts: string[] = [];
  parts.push('あなたは小説の執筆者（AUT）です。');
  parts.push('以下の修正指示にしたがって、シーン ' + ctx.sceneNumber + '（' + sceneLabel + '）を書き直してください。');
  parts.push('（修正 ' + ctx.revisionCount + ' 回目）');
  parts.push('');
  parts.push('## 修正指示（EDTより）');
  parts.push(ctx.reviewComments);
  parts.push('');
  parts.push('## 元の原稿（これを修正すること）');
  parts.push(fence);
  parts.push(ctx.originalManuscript);
  parts.push(fence);
  parts.push('');
  parts.push('## 演出指示');
  parts.push(ctx.directorNote);
  parts.push('');
  parts.push('## 世界設定・公開情報');
  parts.push(ctx.publicHandout);
  parts.push('');
  parts.push('## 各キャラクターの行動提案');
  parts.push(proposals || '（行動提案なし）');
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('## タスク');
  parts.push('');
  parts.push('修正指示を反映した新しい原稿を Markdown で書いてください。');
  parts.push('');
  parts.push(fenceMarkdown);
  parts.push('# シーン ' + ctx.sceneNumber + '（' + sceneLabel + '）');
  parts.push('');
  parts.push('（ここに修正後のシーン本文）');
  parts.push(fence);
  parts.push('');
  parts.push('**制約:**');
  parts.push('- キャラクターの内面や秘密を地の文に書いてはならない');
  parts.push('- 修正指示に直接対応した変更を加えること');

  return parts.join('\n');
}

function getSceneLabel(sceneNumber: number, totalScenes: number): string {
  if (totalScenes !== 4) return 'シーン' + sceneNumber;
  const labels = ['起', '承', '転', '結'];
  return labels[sceneNumber - 1] ?? 'シーン' + sceneNumber;
}
