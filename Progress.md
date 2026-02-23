# 進捗表

## 運用ルール

1. タスクが投入されたら、以下の手順で Markdown チェックリストを作成する
   1. 1ショットで作業できる範囲にサブタスクを分割する
   2. 並行作業できる粒度でさらに分割する
   3. 各サブタスクにテスト作成・統合テスト・Lint・ビルドが必要か検討し、必要なら追加する
   4. 必要に応じて 1.1〜1.3 を再帰的に適用する
2. 作業開始時にサブタスクを `- [x]` でチェックしていく
3. 全サブタスク完了後、Lint・ビルドを通す
4. Feedback.md に追加項目がないか検討する

---

## タスク

### フェーズ0: 基盤整備 ✅

#### 1. プロジェクト初期化
- [x] git init + .gitignore
- [x] package.json（bun, @anthropic-ai/sdk, zod, typescript）
- [x] tsconfig.json（strict モード）
- [x] bunfig.toml
- [x] bun install

#### 2. データ型定義（src/core/types/）
- [x] ids.ts — ActorId, DataId 等の識別子型
- [x] actor.ts — ActorType, ActorOperatingState
- [x] character-state.ts — CharacterStateSchema (zod)
- [x] organization-state.ts — OrganizationStateSchema
- [x] nation-state.ts — NationStateSchema（3層）
- [x] environment-state.ts — EnvironmentStateSchema
- [x] relationship.ts — RelationshipSchema（有向グラフ）
- [x] foreshadowing.ts — ForeshadowingEntrySchema
- [x] timeline.ts — TimelineEventSchema
- [x] evaluation.ts — EvaluationQuadrantSchema
- [x] recall.ts — RecallMemorySchema
- [x] index.ts — 全型の re-export

#### 3. ファイルシステムストア層（src/core/store/）
- [x] paths.ts — DataId → ファイルパス変換
- [x] json-store.ts — JSON 読み書き（決定的シリアライズ）
- [x] markdown-store.ts — Markdown 読み書き
- [x] store.ts — StoreAccess 統合インターフェース

#### 4. 情報可視性エンジン（src/core/visibility/）
- [x] types.ts — BarrierRule, AccessContext 等
- [x] rules.ts — レベル1 絶対遮断ルール（8ルール）
- [x] engine.ts — VisibilityEngine 実装

#### 5〜6. LLM アダプタ・プロンプトテンプレート → アーキテクチャピボットで削除

#### 7. CLI スキャフォールド（src/cli/）
- [x] scaffold.ts — novel/ ディレクトリ生成コマンド

#### 8〜9. テスト・最終確認
- [x] 型チェック通過
- [x] 全テスト通過

### アーキテクチャピボット: recall MCP + SOUL.md ✅

#### A. 基盤準備
- [x] src/llm/, src/prompts/, tests/llm/ を削除
- [x] package.json: @anthropic-ai/sdk → @modelcontextprotocol/sdk に差し替え
- [x] bun install → 既存テスト通過確認（48 pass）

#### B. MCP サーバーコア
- [x] src/mcp/errors.ts — エラー型（5種）
- [x] src/mcp/context.ts — SessionContext + canWrite + テスト
- [x] src/mcp/server.ts — サーバー骨格（stdio transport、9ツール登録）
- [x] src/mcp/tools/actor.ts — set_actor + テスト

#### C. Store ツール
- [x] src/mcp/tools/store.ts — read_data, write_data, list_data + テスト（可視性統合テスト含む）

#### D. Recall ツール
- [x] src/mcp/recall/store.ts — RecallEntry CRUD + テスト
- [x] src/mcp/recall/search.ts — 検索フィルタリング + テスト
- [x] src/mcp/tools/recall.ts — MCP ツール化（5ツール）+ テスト

#### E. テンプレート + Scaffold
- [x] templates/soul-md/ — 7 アクター用 SOUL.md テンプレート（EDT, CHR, AUT, ENV, NAT, ORG, RDR）
- [x] templates/novel-claude-md.ts — CLAUDE.md テンプレート
- [x] templates/mcp-json.ts — .mcp.json テンプレート
- [x] src/cli/scaffold.ts — 拡張（ScaffoldConfig、CLAUDE.md, SOUL.md, .mcp.json 生成）

#### F. 最終確認
- [x] 型チェック通過（tsc --noEmit）
- [x] 全テスト通過（bun test — 105 pass, 0 fail）
- [x] スキャフォールド動作確認
