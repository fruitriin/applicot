/**
 * AUT 執筆プロンプトテンプレート
 *
 * 執筆アクター（AUT）がシーン原稿を書くためのプロンプト。
 * AUT は公開情報・行動提案・過去シーンのみ参照可能。
 * 非公開ハンドアウト（HO-PRV）、GMハンドアウト（HO-GM）、
 * 状態ファイル（ST-*）は参照禁止。
 */

export interface AutWriteContext {
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
  pastScenes: string[];
}

export function buildAutWritePrompt(ctx: AutWriteContext): string {
  const sceneLabel = getSceneLabel(ctx.sceneNumber, ctx.totalScenes);
  const fence = String.fromCharCode(96).repeat(3);
  const fenceMarkdown = fence + 'markdown';

  const proposals = ctx.actionProposals
    .map(p => '### ' + p.actorName + '（' + p.actorId + '）\n' +
          '行動タイプ: ' + p.actionType + '\n' + p.content)
    .join('\n\n');

  const pastSection = ctx.pastScenes.length > 0
    ? ctx.pastScenes.map((s, i) => '### シーン ' + (i + 1) + '\n' + s).join('\n\n')
    : '（まだシーンなし）';

  const parts: string[] = [];
  parts.push('あなたは小説の執筆者（AUT）です。');
  parts.push('以下の情報をもとに、シーン ' + ctx.sceneNumber + '（' + sceneLabel + '）の原稿を書いてください。');
  parts.push('');
  parts.push('## 世界設定・公開情報');
  parts.push(ctx.publicHandout);
  parts.push('');
  parts.push('## GMの演出指示');
  parts.push(ctx.directorNote);
  parts.push('');
  parts.push('## 各キャラクターの行動提案');
  parts.push(proposals || '（行動提案なし）');
  parts.push('');
  parts.push('## これまでのシーン（文脈）');
  parts.push(pastSection);
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('## あなたのタスク');
  parts.push('');
  parts.push('上記の行動提案を組み合わせて、自然な流れのシーン原稿を Markdown で書いてください。');
  parts.push('');
  parts.push(fenceMarkdown);
  parts.push('# シーン ' + ctx.sceneNumber + '（' + sceneLabel + '）');
  parts.push('');
  parts.push('（ここにシーン本文）');
  parts.push(fence);
  parts.push('');
  parts.push('**制約:**');
  parts.push('- キャラクターの内面や秘密を地の文に書いてはならない');
  parts.push('- 演出指示の雰囲気・緊張感を本文に反映すること');
  parts.push('- 前のシーンから自然につながる文体・トーンで書くこと');

  return parts.join('\n');
}

function getSceneLabel(sceneNumber: number, totalScenes: number): string {
  if (totalScenes !== 4) return 'シーン' + sceneNumber;
  const labels = ['起', '承', '転', '結'];
  return labels[sceneNumber - 1] ?? 'シーン' + sceneNumber;
}
