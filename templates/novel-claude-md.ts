export interface NovelClaudeMdConfig {
  title?: string;
  genre?: string;
  characters?: { id: string; name: string }[];
  nations?: { id: string; name: string }[];
  organizations?: { id: string; name: string }[];
  readerPersonas?: string[];
}

export function generateNovelClaudeMd(config: NovelClaudeMdConfig): string {
  const title = config.title ?? "Untitled Novel";
  const genre = config.genre ?? "未設定";

  const actorList: string[] = [
    "- **EDT** (Editor/GM): `actors/EDT/SOUL.md`",
    "- **AUT** (Author): `actors/AUT/SOUL.md`",
    "- **ENV** (Environment): `actors/ENV/SOUL.md`",
  ];

  for (const chr of config.characters ?? []) {
    actorList.push(`- **CHR-${chr.id}** (${chr.name}): \`actors/CHR-${chr.id}/SOUL.md\``);
  }
  for (const nat of config.nations ?? []) {
    actorList.push(`- **NAT-${nat.id}** (${nat.name}): \`actors/NAT-${nat.id}/SOUL.md\``);
  }
  for (const org of config.organizations ?? []) {
    actorList.push(`- **ORG-${org.id}** (${org.name}): \`actors/ORG-${org.id}/SOUL.md\``);
  }
  for (const persona of config.readerPersonas ?? ["ANA", "EMO", "CRT", "NAV"]) {
    actorList.push(`- **RDR-${persona}**: \`actors/RDR-${persona}/SOUL.md\``);
  }

  return `# ${title}

**ジャンル:** ${genre}

## Applicot マルチエージェント小説執筆システム

このディレクトリは Applicot によって管理される物語データです。
複数の AI アクターが情報可視性ルールに従って協調し、物語を生成します。

## MCP ツールの使い方

全てのデータアクセスは MCP ツール経由で行ってください。
ファイルを直接読み書きせず、必ず以下のツールを使用します：

1. **\`set_actor(actorId)\`** — 最初に必ず呼ぶ。自分のアクターIDを設定
2. **\`read_data(dataId)\`** — データ読み取り（可視性チェック付き）
3. **\`write_data(dataId, content)\`** — データ書き込み（権限チェック付き）
4. **\`list_data(prefix)\`** — データ一覧取得
5. **\`remember(content, sceneId, ...)\`** — 記憶を保存
6. **\`recall_recent(limit?)\`** — 最近の記憶を取得
7. **\`search_memories(query?, ...)\`** — 記憶を検索
8. **\`pin_memory(memoryId)\`** — 重要な記憶をピン留め
9. **\`list_memories(layer?)\`** — 記憶一覧

## アクター一覧

${actorList.join("\n")}

## アクター起動方法

各アクターを起動するには、その SOUL.md を読んで指示に従います：

\`\`\`
actors/EDT/SOUL.md を読んで実行して
\`\`\`

EDT がオーケストレーターとなり、Task ツールで他のアクターを子エージェントとして起動します。

## データ構造

| ディレクトリ | 内容 |
|---|---|
| \`actors/\` | 各アクターの SOUL.md（人格・ルール定義） |
| \`handouts/\` | ハンドアウト（公開/非公開/GM） |
| \`state/\` | 状態データ（キャラクター/組織/国家/環境/関係性） |
| \`scenes/\` | 確定済みシーン出力 |
| \`recall/\` | アクターごとの記憶データ |
| \`campaign/\` | アーク進捗・帰結台帳 |
| \`evaluation/\` | 読者評価データ |
| \`meta/\` | システム設定・セッションログ |

## 情報可視性の原則

1. **情報の非対称性が物語を駆動する** — 遮断こそが価値を生む
2. **Author は「無知の執筆者」** — 秘密を知らないからこそ公平に書ける
3. **読者アクターは「純粋な受信者」** — 創作プロセスを知らないからこそ正直に反応できる
4. **Editor は「全知の調整者」** — 全てを見るからこそ適切な制約を設定できる
`;
}
