# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発プロセス

- ** @Progress.md **: タスク投入時に読み、サブタスク分割・進捗チェックを記録する。タスク完了時に更新する
- ** Feedback.md**: 問題発生時やタスク完了時に、プロセスの改善点を記録する


## プロジェクト概要

**Applicot** — Bun ランタイム上で動作するマルチエージェント小説執筆システム。
複数のAIアクター（EDT/CHR/AUT/ENV/NAT/ORG/RDR）が情報可視性ルールに従って協調し、物語を生成する。

## 技術スタック

- **ランタイム**: Bun（TypeScript strict モード）
- **テスト**: `bun test`（単一ファイル: `bun test path/to/file.test.ts`）
  - テスト用の一時ディレクトリはカレントディレクトリ配下に作る（カレントより上の階層に作らない）
- **パッケージ管理**: `bun install`
- **依存**: `@anthropic-ai/sdk`, `zod`（最小構成。追加は必要が確認されてから）
- **ストレージ**: ファイルシステムファースト（JSON/Markdown）。データベースは使用しない

## アーキテクチャ

### Git リポジトリ分離

ツール本体（applicot）と物語データ（novel）は**別の Git リポジトリ**。サブモジュール化しない。相互にバージョンを参照しない。物語データのパスは `--novel-dir` フラグまたは `APPLICOT_NOVEL_DIR` 環境変数で接続する。

### コア設計原則

- **ファイルシステムファースト**: git diff で全変更を追跡可能にすることがパフォーマンスより優先
- **情報可視性**: アクターごとに参照できるデータが厳密に制限される（`planning_doc.md` セクション3のマトリクス参照）
- **JSON 決定的シリアライズ**: `JSON.stringify(data, null, 2) + "\n"`、キー順序固定で git diff をクリーンに保つ
- **エンティティ単位ファイル分割**: 例: `state/characters/chr_a.json` と `chr_b.json` は別ファイル

### src/ ディレクトリ構造

| ディレクトリ | 役割 |
|---|---|
| `core/types/` | 全データ型定義（TypeScript型 + zod スキーマ） |
| `core/store/` | ファイルシステムストア層 |
| `core/visibility/` | 情報可視性エンジン（遮断3レベル: 絶対/原則/推奨） |
| `actors/` | アクター実装（EDT, CHR, AUT, ENV, NAT, ORG, RDR） |
| `orchestrator/` | シーン生成パイプライン、活性化判定、評価 |
| `recall/` | 記憶システム（4層: recent/midterm/longterm/pinned + 連想グラフ） |
| `prompts/` | プロンプトテンプレートと可視性フィルタ付きビルダー |
| `git/` | Git操作層（コミット戦略、hook、ワークツリー） |
| `llm/` | LLMアダプタ層（Claude実装。他LLMはアダプタで吸収） |
| `cli/` | CLIエントリーポイント |

### アクター体系

- **EDT** (Editor/GM): 全データ参照可。シーン設計・レビュー・判断。LLM=Opus推奨
- **CHR-*** (Character): 自身のハンドアウト+公開情報のみ。行動提案。LLM=Sonnet
- **AUT** (Author): 公開情報+承認済み行動のみ（非公開ハンドアウト参照不可）。シーン執筆。LLM=Sonnet
- **RDR-*** (Reader): 確定シーンのみ（状態データ参照不可）。4ペルソナ（ANA/EMO/CRT/NAV）。LLM=Haiku
- **ENV/NAT/ORG**: 環境・国家・組織。階層的情報制限あり

### シーン生成パイプライン

`EDT設計 → ENV/ORG/NAT報告 → CHR行動提案 → AUT執筆 → EDTレビュー → Git commit`

## 設計ドキュメント

| ファイル | 内容 |
|---|---|
| `planning_doc.md` | 設計仕様（全1786行）。アクター定義、可視性マトリクス、情報フロー等 |
| `プロジェクトゴール.md` | 実装準備状況評価。各コンポーネントの◎/○/△/×判定 |
| `実装計画.md` | 実装計画インデックス。アーキテクチャ方針とフェーズ一覧 |
| `実装計画/phase-{0..5}.md` | 各フェーズの詳細計画（ディレクトリ理想状態含む） |

フェーズ順: 0(基盤) → 0.5(recall) → 1(MVP) → 2(情報遮断) → 3(多層世界+評価) → 4(Git高度+キャンペーン) → 5(スケール+スピンアウト)

