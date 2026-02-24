# 進捗表

## 運用ルール

### タスク開始時
1. Feedback.md を読み、前回の改善アクションで未対応のものがあれば考慮する
2. 以下の手順で Markdown チェックリストを作成する
   1. 1ショットで作業できる範囲にサブタスクを分割する
   2. 並行作業できる粒度でさらに分割する
   3. 各サブタスクにテスト作成・統合テスト・Lint・ビルドが必要か検討し、必要なら追加する
   4. 必要に応じて 2.1〜2.3 を再帰的に適用する

### 作業中
3. サブタスク着手時に `- [x]` でチェックしていく。並列可能なタスクはコンテナオーケストレーションを利用する

### タスク完了時
4. Lint・ビルドを通す
5. Feedback.md に問題の記録・改善アクションを追記する。反映済みの項目は削除する
6. `Progresses/YYYY-MM-DD-プラン名.md` にリネームして移動し、ProgressTemplate.md から新規の Progress.md を作成する
7. 実装内容を `blueprints/` に反映する（ディレクトリ構造・DataId・権限等に変更があれば更新）
8. コミットする

---

## タスク


### Phase 1: MVPコアループ実装（着手中）


**目標：** EDT → CHR → AUT → EDT のコアループが動くことを確認


**アーキテクチャ確認（2026-02-24）:**
- BaseActor クラスは不要（MCP サーバーモデルでは set_actor で視点切り替え）
- orchestrator/pipeline.ts が中心
- 各アクターは SOUL.md テンプレートで人格を定義


**実装対象（優先順）:**
- [x] src/orchestrator/types.ts — パイプライン型定義（SceneContext, ActorOutput等）
- [x] src/orchestrator/pipeline.ts — シーン生成パイプライン STEP 1-6 の骨格
- [x] src/prompts/templates/edt-design.ts — EDT シーン設計プロンプト
- [x] src/prompts/templates/chr-action.ts — CHR 行動提案プロンプト
- [x] src/prompts/templates/aut-write.ts — AUT 執筆プロンプト
- [x] src/prompts/builder.ts — プロンプトビルダー（visibility filter統合）
- [x] src/runner/actor.ts — claude -p アクターセッションランナー（2026-02-24）
- [x] src/prompts/templates/edt-review.ts — EDT レビュープロンプト（2026-02-24）
- [x] src/prompts/templates/aut-revise.ts — AUT 修正プロンプト（2026-02-24）
- [x] src/cli/commands/scene.ts — applicot scene next コマンド（2026-02-24）
- [x] tests/orchestrator/pipeline.test.ts — パイプライン単体テスト（2026-02-24）
