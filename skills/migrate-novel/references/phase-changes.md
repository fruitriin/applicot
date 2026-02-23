# フェーズ別ノベルディレクトリ変更一覧

`実装計画/phase-*.md` から抽出した、各フェーズでノベルプロジェクトのディレクトリ構造に加わる変更。
マイグレーション時に「現在のノベルがどのフェーズ相当か」「次にどの変更が必要か」を判断する材料。

## Phase 0 → Phase 0.5: recall 拡張

新規ファイル（各アクターの recall/ 配下）:
- `recall/{actor}/associations.json` — 記憶間リンク
- `recall/{actor}/episodes.json` — エピソード記憶

## Phase 0.5 → Phase 1: MVP 動作

ノベル構造に大きな変更なし。ユーザーがコンテンツを投入する段階:
- `handouts/public/world.md`
- `handouts/private/{chr_id}.md`
- `handouts/gm/scenario.md`
- `state/characters/{chr_id}.json`
- `scenes/cycle_1/scene_{N}.md` （生成物）

## Phase 1 → Phase 2: 全アクター稼働

新規ディレクトリ・ファイル:
- `state/nations/{nat_id}/public.json`
- `state/nations/{nat_id}/restricted.json`
- `state/nations/{nat_id}/secret.json`
- `state/organizations/{org_id}.json`
- `meta/editor_notes.md` — EDT 判断記録
- `handouts/gm/triggers.md` — トリガー条件
- `handouts/gm/endings.md` — エンディング分岐

新規 recall:
- `recall/ENV/`, `recall/NAT-{id}/`, `recall/ORG-{id}/`

## Phase 2 → Phase 3: 評価系完全実装

evaluation/ の詳細化:
- `evaluation/quadrant.json` — 四象限分類
- `evaluation/emotions.json` — 感情タグ
- `evaluation/predictions.json` — 予測・照合
- `evaluation/layer_contrast.json` — 層間コントラスト
- `evaluation/report.md` — 評価レポート

recall/ 全アクター 4 層完成:
- `recall/{actor}/recent.json`
- `recall/{actor}/midterm.json`
- `recall/{actor}/longterm.json`
- `recall/{actor}/pinned.json`

## Phase 3 → Phase 4: キャンペーン・並行世界

新規ディレクトリ・ファイル:
- `scenes/interlude_{N}/bridge_{M}.md` — インターリュードシーン
- `campaign/arcs/{chr_id}.md` — キャラクターアーク
- `evaluation/report_cycle_{N}.md` — サイクル別レポートアーカイブ

scenes/ が複数サイクルに拡大:
- `scenes/cycle_2/`, `scenes/cycle_3/` ...

## Phase 4 → Phase 5: スケール・スピンアウト

meta/config.json にフィールド追加:
- `scale_level`: "small" | "medium" | "large" | "epic"
- `scale_history`: スケール変更履歴

スピンアウトは別リポジトリとして作成されるため、既存ノベルの構造変更は最小限。
