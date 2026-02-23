# フェーズ4: Git 高度機能とキャンペーン

## 目的

並行世界探索とサイクル連鎖を実装する。

## 前提

フェーズ3の多層世界と評価系が完全に動作していること。

---

## 作業一覧

- [ ] ブランチ分岐/マージの自動管理
- [ ] ワークツリーによる並行世界の同時進行
- [ ] cherry-pick 時の情報整合性検証
- [ ] インターリュード処理（5バリエーション）
- [ ] キャンペーンレベルのアーク追跡（TRK-ARC）
- [ ] 帰結台帳の管理（TRK-CSQ）
- [ ] サイクル遷移モードの動的切替（適応モード）
- [ ] CLI 拡張（branch, worktree, merge コマンド）

## 実装規模

追加 約3000-4000行 + Git自動化スクリプト

---

## ディレクトリ理想状態

フェーズ4完了時点。`★` はこのフェーズで新規追加。

### src/

```
src/
├── core/                              # (変更なし)
├── actors/                            # (変更なし)
├── orchestrator/
│   ├── pipeline.ts                    # (変更なし)
│   ├── activation.ts                  # (変更なし)
│   ├── cascade.ts                     # (変更なし)
│   ├── evaluation.ts                  # (変更なし)
│   └── interlude.ts                   ★ インターリュード処理（5モード）
├── campaign/                          ★ 新規ディレクトリ
│   ├── arcs.ts                        ★ アーク進捗追跡（段階モデル）
│   ├── consequences.ts                ★ 帰結台帳管理（潜在/発現/消滅）
│   └── cycle-transition.ts            ★ サイクル遷移モード切替
├── recall/                            # (変更なし)
├── git/
│   ├── commit.ts                      # 更新: branch/merge コミット種別追加
│   ├── hooks/
│   │   ├── pre-commit.ts              # (変更なし)
│   │   ├── post-commit.ts             # (変更なし)
│   │   └── pre-merge.ts               ★ cherry-pick/merge 時の整合性検証
│   ├── worktree.ts                    ★ ワークツリー管理（並行世界 CRUD）
│   └── merge.ts                       ★ マージ + 情報整合性検証
├── llm/                               # (変更なし)
├── prompts/
│   ├── builder.ts                     # (変更なし)
│   └── templates/
│       ├── (既存テンプレート群)
│       ├── edt-interlude.ts           ★ EDT インターリュード設計テンプレート
│       ├── edt-arc-review.ts          ★ EDT アーク段階遷移判定テンプレート
│       └── chr-autonomous.ts          ★ CHR インターリュード自律行動テンプレート
└── cli/
    └── index.ts                       # 更新: branch, worktree, merge, interlude,
                                       #        arc, consequences, handout edit,
                                       #        override, rollback, evaluate, report
```

### novel/ — キャンペーン進行中（複数サイクル + 並行世界）

```
novel/
├── handouts/                          # (構造は変更なし。サイクル遷移で内容更新)
├── state/                             # (構造は変更なし)
├── scenes/
│   ├── cycle_1/
│   │   └── scene_1.md ... scene_12.md # フルサイクル（最大12シーン）
│   ├── cycle_2/                       ★ 第2サイクル
│   │   └── scene_1.md ...
│   └── interlude_1/                   ★ サイクル間インターリュード
│       └── bridge_1.md                ★ ブリッジシーン
├── recall/                            # (構造は変更なし)
├── campaign/
│   ├── arcs/
│   │   ├── chr_a.md                   ★ CHR-A のアーク進捗
│   │   ├── chr_b.md                   ★ CHR-B のアーク進捗
│   │   └── chr_c.md                   ★ ...
│   └── consequences.md                ★ 帰結エントリが蓄積
├── evaluation/
│   ├── (既存ファイル群)
│   └── report_cycle_1.md              ★ サイクル別レポートのアーカイブ
└── meta/
    ├── config.json
    ├── session_log.md
    └── editor_notes.md
```

### 並行世界（ワークツリー）の例

```
novel/                                 # main（正史）
../novel-worktree-alliance/            ★ 並行世界: 同盟ルート
├── (novel/ と同一構造)
│   ├── state/                         # main とは異なる状態
│   ├── recall/                        # main とは異なる記憶
│   └── scenes/                        # main とは異なるシーン
└── ...

../novel-worktree-betrayal/            ★ 並行世界: 裏切りルート
└── ...
```

### tests/

```
tests/
├── (既存テスト群)
├── orchestrator/
│   └── interlude.test.ts              ★ 5モード切替テスト
├── campaign/                          ★ 新規ディレクトリ
│   ├── arcs.test.ts                   ★ 段階遷移テスト
│   └── consequences.test.ts           ★ 帰結ライフサイクルテスト
├── git/
│   ├── worktree.test.ts               ★ ワークツリー CRUD テスト
│   ├── merge.test.ts                  ★ マージ整合性テスト
│   └── hooks/
│       └── pre-merge.test.ts          ★
└── integration/
    ├── (既存テスト群)
    ├── multi-cycle.test.ts            ★ 複数サイクル + インターリュード E2E
    └── parallel-worlds.test.ts        ★ 並行世界の情報空間分離テスト
```

---

## 1. ブランチと並行世界

### 情報空間の分離

```
main ブランチ:     正史。全アクターの「現在の世界」
worktree-A:        並行世界A。独立した情報空間を持つ
worktree-B:        並行世界B。独立した情報空間を持つ

各ワークツリーは独立した状態データを持つ:
  - worktree-A の CHR-A は、main の CHR-A と異なる recall を持つ
  - worktree-A の ST-NAT は、main の ST-NAT と異なる値を持つ
  - 情報遮断ルールは全ワークツリーで共通
```

### ワークツリー管理

```typescript
// src/git/worktree.ts

interface WorktreeManager {
  // 並行世界の作成（ブランチ + ワークツリー）
  create(name: string, fromCommit?: string): Promise<Worktree>;

  // 並行世界の一覧
  list(): Promise<Worktree[]>;

  // 並行世界の削除
  remove(name: string): Promise<void>;

  // 並行世界間の差分表示
  diff(worldA: string, worldB: string): Promise<WorldDiff>;
}
```

### cherry-pick 時の情報整合性検証

```
worktree-B のシーンを main に cherry-pick する場合:
  1. 該当シーンが参照している情報が main にも存在するか検証
  2. 存在しない情報への参照がある場合:
     - その情報を main にも導入する（ハンドアウト修正）
     - または、該当参照を除去するようシーンを修正
  3. EDT が整合性を最終確認
  4. pre-merge hook で自動検証
```

---

## 2. インターリュード処理

planning_doc.md セクション5.3。サイクル間遷移の5バリエーション。

### インターリュードフロー

```
STEP 1: EDT がサイクル完了レビューを実施
  入力: 全データ + EVL-RPT
  出力: サイクル完了レポート

STEP 2: モードに応じた次サイクル設計

STEP 3: CHR-* のインターリュード自律行動
  各 CHR-* 入力: 自分のハンドアウト + recall + サイクル間時間経過情報
  各 CHR-* 出力: 「この期間に自分はこうしていた」

STEP 4: ハンドアウト・状態の更新（EDT 管轄、HMN 承認）

STEP 5: 全更新をコミット、次サイクルのタグ付け
```

### 5つのモード

| モード | 人間関与度 | 動作 |
|---|---|---|
| **完全人間主導** | 最大 | HMN が全ハンドアウトを再設計 |
| **AI提案人間選択** | 高 | EDT が提案書を生成 → HMN が選択 |
| **シードモード** | 中 | HMN がシード投入 → EDT が具体化 |
| **エコシステム** | 最小 | EDT が自律的に設計 |
| **適応モード** | 可変 | 状況に応じて上記を切替 |

```typescript
// src/orchestrator/interlude.ts

type InterludeMode =
  | "human_directed"
  | "ai_proposal"
  | "seed"
  | "ecosystem"
  | "adaptive";

async function executeInterlude(
  mode: InterludeMode,
  cycleReport: CycleReport,
): Promise<NextCycleDesign> {
  // STEP 1: サイクル完了レビュー
  const review = await edt.reviewCycle(cycleReport);

  // STEP 2: モードに応じた設計
  let design: NextCycleDesign;
  switch (mode) {
    case "human_directed":
      design = await waitForHumanDesign();
      break;
    case "ai_proposal":
      const proposals = await edt.proposeNextCycle(review);
      design = await waitForHumanChoice(proposals);
      break;
    case "seed":
      const seed = await waitForHumanSeed();
      design = await edt.elaborateSeed(seed, review);
      break;
    case "ecosystem":
      design = await edt.designNextCycle(review);
      break;
    case "adaptive":
      design = await edt.adaptiveDesign(review);
      break;
  }

  // STEP 3: CHR-* の自律行動
  const autonomousActions = await executeAutonomousActions(design);

  // STEP 4-5: 更新とコミット
  await applyUpdates(design, autonomousActions);
  await commitCycleTransition(design);

  return design;
}
```

---

## 3. キャンペーン管理

### アーク進捗追跡（TRK-ARC）

```
campaign/arcs/{chr_id}.md

各キャラクターのアーク（成長/変化の軌跡）を追跡。
段階モデル:
  - 設定（Establishment）: キャラクターの初期状態の提示
  - 挑戦（Challenge）: 成長を促す困難の発生
  - 葛藤（Struggle）: 内面的な闘い
  - 転換（Turning Point）: 決定的な変化の瞬間
  - 統合（Integration）: 変化した自己の受容

段階遷移は EDT が判断し承認する。
```

### 帰結台帳（TRK-CSQ）

```
campaign/consequences.md

物語内の行動がもたらした帰結を追跡。
各帰結エントリ:
  - 原因行動: どのシーンでの誰の何の行動か
  - 帰結の種類: 即時/遅延/潜在
  - 発現条件: いつ/どの条件で表面化するか
  - 自然消滅ルール: 一定期間未発現なら消滅するか否か
  - 状態: 潜在/発現済み/消滅
```

---

## 4. Git コミット戦略（フル版）

| コミットタイプ | メッセージ規約 | タイミング |
|---|---|---|
| シーン確定 | `scene(cycle-N/scene-M): <概要>` | EDT承認後 |
| 状態更新 | `state: update <対象> after scene-M` | post-commitフック |
| ハンドアウト変更 | `handout: <変更種別> <対象>` | EDT/HMN操作時 |
| 情報開示イベント | `disclosure: <秘密の概要> revealed` | 情報開示イベント時 |
| サイクル遷移 | `cycle: begin cycle-N / end cycle-N` | サイクル境界 |
| recall更新 | `recall: update <actor_id>` | シーン確定と同時 |
| ブランチ分岐 | `branch: explore <展開名>` | 並行世界作成時 |
| マージ | `merge: adopt <展開名> into main` | 世界線統合時 |

---

## 5. CLI 拡張

```bash
# 既存コマンド（フェーズ1）に加えて:

# 介入
applicot handout edit <target>   # ハンドアウト編集
applicot override <command>      # HMN特権操作
applicot rollback <commit>       # ロールバック

# 評価
applicot evaluate                # 読者評価を実行
applicot report                  # 最新の評価レポート表示

# Git操作
applicot branch create <name>    # 並行世界の作成
applicot worktree list           # 並行世界一覧
applicot merge <branch>          # 世界線の統合

# キャンペーン
applicot interlude               # インターリュード実行
applicot arc <chr_id>            # アーク進捗表示
applicot consequences            # 帰結台帳表示
```
