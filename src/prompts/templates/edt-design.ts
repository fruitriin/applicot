export interface EdtDesignContext {
  sceneNumber: number;
  cycleNumber: number;
  totalScenes: number;
  publicHandout: string;
  gmHandout: string;
  privateHandouts: Record<string, string>;
  relationships: string;
  foreshadowing: string;
  timeline: string;
  pastSceneSummaries: string[];
}

export function buildEdtDesignPrompt(ctx: EdtDesignContext): string {
  const sceneLabel = getSceneLabel(ctx.sceneNumber, ctx.totalScenes);
  const pastScenes = ctx.pastSceneSummaries.length > 0
    ? ctx.pastSceneSummaries.map((s, i) => 'シーン' + (i + 1) + ': ' + s).join('\n')
    : '（まだシーンなし）';
  const privateSection = Object.entries(ctx.privateHandouts)
    .map(([id, content]) => '### ' + id + '\n' + content)
    .join('\n\n');
  const fence = String.fromCharCode(96).repeat(3);
  const fenceJson = fence + 'json';
  const parts: string[] = [];
  parts.push('あなたは小説の編集者兼ゲームマスター（EDT）です。');
  parts.push('以下の情報をもとに、次のシーンを設計してください。');
  parts.push('');
  parts.push('## サイクル・シーン情報');
  parts.push(ctx.publicHandout);
  parts.push(ctx.gmHandout);
  parts.push(privateSection);
  parts.push(ctx.relationships);
  parts.push(ctx.foreshadowing);
  parts.push(ctx.timeline);
  parts.push(pastScenes);
  parts.push(fenceJson);
  parts.push('{');
  parts.push('  "directorNote": "このシーンで達成すべきこと、雰囲気、焦点（100字以内）",');
  parts.push('  "activatedActors": ["chr_a", "chr_b"],');
  parts.push('  "dramaticTension": "このシーンで高めるべき緊張感または感情（50字以内）"');
  parts.push('}');
  parts.push('');
  parts.push('**制約:**');
  parts.push('activatedActors は今シーンに登場するキャラクターのIDのみ');
  parts.push('情報遮断を意識せよ——各キャラクターは他者の秘密を知らない');
  parts.push(sceneLabel + 'に相応しい展開を設計すること');
  parts.push(fence);
  return parts.join('\n');
}

function getSceneLabel(sceneNumber: number, totalScenes: number): string {
  if (totalScenes !== 4) return 'シーン' + sceneNumber;
  const labels = ['起', '承', '転', '結'];
  return labels[sceneNumber - 1] ?? 'シーン' + sceneNumber;
}
