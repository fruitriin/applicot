---
name: migrate-novel
description: >
  既存のノベルプロジェクトを最新の Applicot ディレクトリ構造にマイグレーションする。
  blueprints/directories.md を正とし、不足ディレクトリの作成・ファイルの再配置・
  テンプレート再生成を安全に実行する。フェーズ間の構造変化にも対応。
  使用タイミング: Applicot のアップデート後にノベルプロジェクトを最新構造に合わせたいとき、
  「migrate」「マイグレーション」「ディレクトリ構造を更新」「novelを最新化」などと言われたとき。
---

# migrate-novel

既存ノベルプロジェクトを最新の Applicot ディレクトリ構造に安全にマイグレーションする。

## 前提条件

- applicot プロジェクトルートで実行する
- 対象ノベルプロジェクトのパスをユーザーから受け取る（例: `novels/my-novel`）
- 対象ノベルプロジェクトが git リポジトリであること（安全確認のため）

## リファレンス

- **正の定義**: `blueprints/directories.md` — 最新のディレクトリ構造・DataId マッピング
- **フェーズ別変更一覧**: `references/phase-changes.md` — 各フェーズでノベル構造に加わる変更の概要。差分特定時に「何が変わったか」の判断材料として参照する
- **実装計画詳細**: `実装計画/phase-{0..5}.md` — 各フェーズの詳細計画。references/phase-changes.md で不足がある場合に参照する

## ワークフロー

以下の 6 ステップを **順番に** 実行する。各ステップの完了をユーザーに報告してから次へ進む。

---

### Step 1: git status で安全確認

対象ノベルプロジェクトのルートで `git status` を実行する。

```bash
git -C {novel-path} status --porcelain
```

**未コミットの変更がある場合**: マイグレーションを中止し、先にコミットまたはスタッシュするよう促す。

```
⚠️ 未コミットの変更があります。マイグレーション前にコミットしてください:
  M handouts/public/world-setting.md
  ?? state/characters/charlie.json
```

**クリーンな場合**: 次のステップへ進む。

---

### Step 2: 現在のディレクトリ構造を把握

対象ノベルプロジェクトで `tree` を実行し、現状を記録する。

```bash
tree {novel-path} -a --dirsfirst -I '.git'
```

結果を記憶しておく（Step 3 の差分検出に使う）。

---

### Step 3: 理想構造との差分を分析

1. `blueprints/directories.md` を読み、最新の理想構造を把握する
2. 必要に応じて `references/phase-changes.md` を読み、フェーズ間の変化を確認する
3. 現状（Step 2）と理想を比較し、差分を以下の 5 カテゴリに分類する:

| カテゴリ | 例 | 操作 |
|---|---|---|
| **不足ディレクトリ** | `evaluation/` がない | `mkdir -p` で作成 |
| **不足初期ファイル** | `state/timeline.json` がない | scaffold と同じ初期値で作成 |
| **再配置が必要なファイル** | 旧パスにあるファイルが新パスに移動 | `git mv` で移動 |
| **不要になったディレクトリ** | 旧構造にのみ存在 | ユーザー確認後に削除 |
| **テンプレート更新** | SOUL.md, CLAUDE.md, .mcp.json | 再生成（内容は上書き） |

分類結果をユーザーに提示し、**実行前に承認を得る**:

```
📋 マイグレーション計画:

  作成:
    + evaluation/
    + evaluation/report.md

  移動:
    → tracking/foreshadowing.json → state/foreshadowing.json

  テンプレート再生成:
    ↻ actors/EDT/SOUL.md
    ↻ CLAUDE.md
    ↻ .mcp.json

  削除候補（要確認）:
    ? tracking/  （空になる場合）

  変更なし: handouts/, scenes/, recall/ ...

実行してよいですか？
```

---

### Step 4: 再配置を実行

ユーザー承認後、以下の順序で実行する（依存関係を考慮）:

#### 4a. 不足ディレクトリの作成

```bash
mkdir -p {novel-path}/{new-dir}
```

#### 4b. ファイルの移動（git mv）

移動は必ず `git mv` を使い、git の履歴を保持する。

```bash
git -C {novel-path} mv {old-path} {new-path}
```

移動先ディレクトリが存在することを確認してから実行する。

#### 4c. 不足初期ファイルの作成

`blueprints/directories.md` のスキャフォールド生成ファイル表を参照し、初期値で作成する。
JSON は `JSON.stringify(data, null, 2) + "\n"` の形式。

既に内容が存在するファイルは **絶対に上書きしない**。不足ファイルのみ新規作成する。

scaffold 初期値:

| ファイル | 初期値 |
|---|---|
| `state/environment.json` | `{}` |
| `state/relationships.json` | `{ "edges": [] }` |
| `state/foreshadowing.json` | `[]` |
| `state/tension_curve.json` | `[]` |
| `state/timeline.json` | `[]` |
| `meta/config.json` | `{ "genre": "", "scale": "medium", "title": "", "createdAt": "..." }` |
| `campaign/consequences.md` | `# Consequences Ledger\n` |
| `meta/session_log.md` | `# Session Log\n` |

#### 4d. テンプレート再生成

SOUL.md, CLAUDE.md, .mcp.json を applicot のテンプレートから再生成する。

**エンティティ検出**（CLAUDE.md 再生成に必要）:

```bash
ls {novel-path}/actors/
# CHR-*, NAT-*, ORG-* ディレクトリからエンティティ一覧を抽出
```

`meta/config.json` から title, genre を読み取る。

**テンプレート生成コマンド例**:

```bash
bun -e "
import { generateEdtSoul } from './templates/soul-md/edt.ts';
console.log(generateEdtSoul());
"
```

**SOUL.md の再生成判断**:
- テンプレートから再生成した内容と現在の内容を `diff` で比較する
- 差分がある場合、ユーザーに差分を提示して上書きするか確認する
- ユーザーがカスタマイズした部分を保持したい場合は上書きしない

**CLAUDE.md と .mcp.json** は常に再生成する（ユーザーカスタマイズが想定されないため）。

#### 4e. 空ディレクトリの削除

移動後に空になったディレクトリがあれば、ユーザー確認の上で削除する。

---

### Step 5: 変更履歴レポート

実行した操作を構造化してユーザーに報告する。

```
✅ マイグレーション完了

実行した操作:
  作成 (2):
    + evaluation/
    + evaluation/report.md

  移動 (1):
    tracking/foreshadowing.json → state/foreshadowing.json

  テンプレート再生成 (3):
    ↻ actors/EDT/SOUL.md
    ↻ CLAUDE.md
    ↻ .mcp.json

  削除 (1):
    - tracking/ （空ディレクトリ）

  スキップ (0):

変更なし: handouts/, scenes/, recall/, state/characters/, ...
```

---

### Step 6: コミット

変更をステージングし、結果をユーザーに提示する。

```bash
cd {novel-path} && git add -A && git status
```

コミットメッセージを提案する:

```
migrate: update directory structure to latest Applicot

- Add evaluation/ directory
- Move tracking/foreshadowing.json to state/foreshadowing.json
- Regenerate EDT SOUL.md, CLAUDE.md, .mcp.json
- Remove empty tracking/ directory
```

ユーザー承認後にコミットを実行する。

---

## 安全原則

1. **データを失わない**: ユーザー作成ファイル（handouts, state, scenes, recall）は移動のみ、削除しない
2. **git mv を使う**: ファイル移動は必ず `git mv` で git 履歴を保持する
3. **上書き前に確認**: テンプレート再生成時は差分を見せてから上書きする
4. **段階的に承認**: Step 3 で計画を提示し承認を得てから実行する
5. **ロールバック可能**: git コミット前に全操作を完了し、問題があれば `git checkout .` で戻せる
