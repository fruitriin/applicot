/**
 * CHR 行動提案プロンプトテンプレート
 *
 * キャラクターアクター（CHR）が次の行動を提案するためのプロンプト。
 * CHR は自分の非公開ハンドアウトと状態のみ参照可能。
 * 他の CHR のプライベートハンドアウト（HO-PRV）は参照禁止。
 */

export interface ChrActionContext {
  actorId: string;
  actorName: string;
  sceneNumber: number;
  cycleNumber: number;
  publicHandout: string;
  privateHandout: string;
  characterState: string;
  recentMemory: string;
  directorNote: string;
  observableOthers: Array<{ id: string; name: string; observable: string }>;
}

export function buildChrActionPrompt(ctx: ChrActionContext): string {
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + 'json';
  const others = ctx.observableOthers.length > 0
    ? ctx.observableOthers.map(o => '- ' + o.name + '（' + o.id + '）: ' + o.observable).join('\n')
    : '（他のキャラクターは今シーンに登場しない）';

  const parts: string[] = [];
  parts.push('あなたは「' + ctx.actorName + '」というキャラクターです。');
  parts.push('以下の情報をもとに、次のシーンでの行動を提案してください。');
  parts.push('');
  parts.push('## あなたが知っている情報（公開）');
  parts.push(ctx.publicHandout);
  parts.push('');
  parts.push('## あなただけが知っている秘密');
  parts.push(ctx.privateHandout);
  parts.push('');
  parts.push('## あなたの現在の状態');
  parts.push(ctx.characterState);
  parts.push('');
  parts.push('## あなたの最近の記憶');
  parts.push(ctx.recentMemory || '（まだ記憶なし）');
  parts.push('');
  parts.push('## 今シーンの演出指示（GMより）');
  parts.push(ctx.directorNote);
  parts.push('');
  parts.push('## 今シーンに登場する他のキャラクター（あなたが観察できる情報のみ）');
  parts.push(others);
  parts.push('');
  parts.push('---');
  parts.push('');
  parts.push('## あなたのタスク');
  parts.push('');
  parts.push('このシーンでの行動を提案してください。以下の形式で JSON を出力してください：');
  parts.push('');
  parts.push(fenceJson);
  parts.push('{');
  parts.push('  \"actionType\": \"dialogue | action | thought | reaction のいずれか\",');
  parts.push('  \"content\": \"行動や発言の具体的な内容（200字以内）\",');
  parts.push('  \"internalReason\": \"あなたがそう行動する内面的な理由（100字以内）\",');
  parts.push('  \"citations\": [\"根拠にしたハンドアウトや状態のID\"]');
  parts.push('}');
  parts.push(fence);
  parts.push('');
  parts.push('**制約:**');
  parts.push('- 他のキャラクターが知らない秘密を口にしてはならない');
  parts.push('- citations には実際に参照した情報のIDのみを記載すること');
  parts.push('- internalReason は GM（EDT）のみが読むメタ情報');

  return parts.join('\n');
}
