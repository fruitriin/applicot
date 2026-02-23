---
name: init-novel
description: >
  Applicot ノベルプロジェクトの雛形を作成する。blueprints/directories.md に基づいたディレクトリ構造・
  SOUL.md・CLAUDE.md・.mcp.json・初期データファイルを生成する。
  使用タイミング: 新しい小説プロジェクトを始めるとき、「小説を作りたい」「ノベルプロジェクトを初期化したい」
  「init novel」「scaffold」などと言われたとき。novels/ は .gitignore 済みでも問題なく作成する。
---

# init-novel

Applicot のノベルプロジェクト雛形を `novels/` 配下に生成するスキル。

## ワークフロー

### 1. ユーザーから設定を収集

以下を対話で確認する（省略された項目にはデフォルト値を使用）:

| 項目 | 必須 | デフォルト | 例 |
|---|---|---|---|
| プロジェクト名（ディレクトリ名） | ○ | — | `my-novel` |
| タイトル | △ | プロジェクト名 | `銀河の果ての図書館` |
| ジャンル | △ | `""` | `fantasy`, `sci-fi`, `mystery` |
| キャラクター | △ | なし | `[{id: "alice", name: "アリス"}, {id: "bob", name: "ボブ"}]` |
| 国家 | △ | なし | `[{id: "kingdom_a", name: "アルカディア王国"}]` |
| 組織 | △ | なし | `[{id: "guild_a", name: "冒険者ギルド"}]` |
| 読者ペルソナ | △ | 全4種 | `["ANA", "EMO", "CRT", "NAV"]` |

- id は英数字とアンダースコアのみ（ファイル名・DataId に使われる）
- 「とりあえず始めたい」場合はプロジェクト名だけで OK
- キャラクター等は後から手動追加も可能

### 2. scaffold を実行

設定 JSON を一時ファイルに書き出し、ランナースクリプトを実行する。

```bash
# 1. 設定ファイルを /tmp/applicot-scaffold-config.json に書き出す（Write ツール使用）

# 2. scaffold 実行（applicot プロジェクトルートから）
bun run skills/init-novel/scripts/scaffold-runner.ts /tmp/applicot-scaffold-config.json

# 3. 一時ファイル削除
rm /tmp/applicot-scaffold-config.json
```

設定 JSON の形式:

```json
{
  "novelRoot": "novels/{project-name}",
  "title": "タイトル",
  "genre": "ジャンル",
  "characters": [
    { "id": "alice", "name": "アリス" }
  ],
  "nations": [
    { "id": "kingdom_a", "name": "アルカディア王国" }
  ],
  "organizations": [
    { "id": "guild_a", "name": "冒険者ギルド" }
  ],
  "readerPersonas": ["ANA", "EMO", "CRT", "NAV"]
}
```

### 3. scaffold 後のガイド

生成完了後、ユーザーに次のステップを案内する:

```
✅ novels/{project-name}/ にノベルプロジェクトを作成しました。

生成されたもの:
  - actors/*/SOUL.md — 各アクターの人格定義
  - CLAUDE.md — プロジェクトルール
  - .mcp.json — MCP サーバー接続設定
  - state/*.json — 初期状態データ
  - meta/config.json — プロジェクト設定

次のステップ:
  1. handouts/public/ に世界設定を書く（例: world-setting.md）
  2. handouts/private/{id}.md にキャラクターの秘密を書く
  3. handouts/gm/ にシナリオ・トリガーを書く
  4. state/characters/{id}.json にキャラクター初期状態を設定する
  5. novels/{project-name}/ を別の git リポジトリとして初期化する（推奨）

ヒント: novels/{project-name}/ ディレクトリで Claude Code を開き、
EDT として作業を始められます。
```

### 4. git リポジトリ初期化（任意）

ユーザーが望む場合、ノベルディレクトリを独立した git リポジトリとして初期化する:

```bash
cd novels/{project-name} && git init && git add -A && git commit -m "Initial scaffold"
```

applicot 本体の `.gitignore` に `novels/` が含まれているため、
ノベルデータは applicot リポジトリには含まれない。これは設計通り。

## 生成されるディレクトリ構造

`blueprints/directories.md` を参照。主要な構成:

```
novels/{project-name}/
├── CLAUDE.md, .mcp.json
├── actors/{EDT,AUT,ENV,CHR-*,NAT-*,ORG-*,RDR-*}/SOUL.md
├── handouts/{public,private,gm}/        ← ユーザーが内容を作成
├── state/{characters,organizations,nations}/, *.json
├── scenes/, recall/, campaign/, evaluation/, meta/
```

## 注意事項

- `novels/` は applicot の `.gitignore` に含まれている場合があるが、問題なく作成してよい
- ノベルデータと applicot ツール本体は別リポジトリとして管理する設計
- JSON は `JSON.stringify(data, null, 2) + "\n"` で保存（scaffold が自動的に行う）
- id は英数字・アンダースコアのみ使用可能
