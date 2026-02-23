# フェーズ1: MVP — コアループの動作検証

## 目的

EDT → CHR → AUT → EDT のコアループが動作することを確認する。

## 前提

フェーズ0の成果物（型定義、Store、可視性エンジンコア、LLMアダプタ）が完成していること。

---

## 構成

```
アクター構成:
  - CHR-*: 2名（CHR-A, CHR-B）
  - ENV: なし（EDTがシーンプロンプト内で天候メモを直接記述）
  - NAT/ORG: なし
  - AUT: 1
  - EDT: 1
  - RDR-*: 1（RDR-NAV のみ）
  - Git: main ブランチのみ

データ構成:
  - HO-PUB: 1ファイル（世界設定）
  - HO-PRV: 2名分（CHR-A, CHR-B）
  - HO-GM: 簡易版（scenario.md のみ）
  - 情報遮断: レベル1（絶対遮断）のみ
  - recall: 基本実装（劣化処理なし、recent.json のみ使用）
  - 評価: 四象限の基本形のみ（遅延再分類なし）

スコープ:
  - 1サイクル（4シーン: 起承転結 各1シーン）
```

## 作業一覧

- [ ] 基底アクタークラスの実装
- [ ] CHR アクターの実装（行動提案生成）
- [ ] AUT アクターの実装（シーン原稿執筆）
- [ ] EDT アクターの実装（シーン設計 + レビュー）
- [ ] RDR-NAV アクターの実装（素朴な読者評価）
- [ ] シーン生成パイプラインの実装（STEP 1-6）
- [ ] 基本的なアクター活性化判定（CHR のみ）
- [ ] recall 基本実装（recent.json への書き込み/読み取り）
- [ ] Git コミット戦略の基本実装
- [ ] プロンプトテンプレート 5種（EDT設計, EDT レビュー, CHR, AUT, RDR-NAV）
- [ ] CLI 基本コマンド（init, scene next, status）

## 検証項目

- [ ] CHR-A が CHR-B の HO-PRV-B を参照していないこと
- [ ] AUT が HO-PRV-* を参照していないこと
- [ ] EDT のシーンプロンプトが適切にアクター活性化を制御
- [ ] シーンが起承転結として成立すること
- [ ] Git コミットが規約通りに行われること
- [ ] RDR-NAV が四象限評価を出力すること

## 実装規模

約2000-3000行 + プロンプトテンプレート5種

---

## ディレクトリ理想状態

フェーズ1完了時点。`★` はこのフェーズで新規追加。

### src/

```
src/
├── core/                              # (フェーズ0から変更なし)
│   ├── types/
│   ├── store/
│   └── visibility/
├── actors/                            ★ 新規ディレクトリ
│   ├── base.ts                        ★ 基底アクタークラス
│   ├── chr.ts                         ★ CHR-*（キャラクター）
│   ├── aut.ts                         ★ AUT（Author）
│   ├── edt.ts                         ★ EDT（Editor/GM）
│   └── rdr.ts                         ★ RDR-NAV のみ（1ペルソナ）
├── orchestrator/                      ★ 新規ディレクトリ
│   ├── pipeline.ts                    ★ シーン生成パイプライン（STEP 1-6）
│   └── activation.ts                  ★ アクター活性化判定（CHR のみ簡易版）
├── git/                               ★ 新規ディレクトリ
│   └── commit.ts                      ★ コミット戦略（基本3種のメッセージ規約）
├── llm/                               # (フェーズ0から変更なし)
├── prompts/
│   ├── builder.ts                     # (フェーズ0から変更なし)
│   └── templates/
│       ├── chr-action.ts              # (フェーズ0で作成済み)
│       ├── aut-write.ts               # (フェーズ0で作成済み)
│       ├── edt-design.ts             # (フェーズ0で作成済み)
│       ├── edt-review.ts             ★ EDT レビューテンプレート
│       └── rdr-nav.ts                 ★ RDR-NAV 素朴な読者テンプレート
└── cli/
    ├── scaffold.ts                    # (フェーズ0で作成済み)
    └── index.ts                       ★ CLI エントリーポイント (init, scene, status, actors)
```

### novel/ — 1サイクル完走後の状態

```
novel/
├── handouts/
│   ├── public/
│   │   └── world.md                   ★ 世界設定（初期セットアップ時に作成）
│   ├── private/
│   │   ├── chr_a.md                   ★ CHR-A の非公開ハンドアウト
│   │   └── chr_b.md                   ★ CHR-B の非公開ハンドアウト
│   └── gm/
│       └── scenario.md                ★ GM シナリオ（簡易版）
├── state/
│   ├── characters/
│   │   ├── chr_a.json                 ★ CHR-A の状態
│   │   └── chr_b.json                 ★ CHR-B の状態
│   ├── organizations/                 # (空 — フェーズ2で使用)
│   ├── nations/                       # (空 — フェーズ2で使用)
│   ├── environment.json               # (初期値のまま — ENV未実装)
│   ├── relationships.json             ★ CHR-A ↔ CHR-B の関係
│   ├── foreshadowing.json             ★ EDT が管理する伏線
│   ├── tension_curve.json             ★ シーンごとの緊張度
│   └── timeline.json                  ★ 4シーン分のイベント
├── scenes/
│   └── cycle_1/                       ★ 新規ディレクトリ
│       ├── scene_1.md                 ★ 起
│       ├── scene_2.md                 ★ 承
│       ├── scene_3.md                 ★ 転
│       └── scene_4.md                 ★ 結
├── recall/
│   ├── chr_a/
│   │   └── recent.json                ★ CHR-A の記憶（劣化なし）
│   └── chr_b/
│       └── recent.json                ★ CHR-B の記憶（劣化なし）
├── campaign/
│   ├── arcs/                          # (空 — フェーズ4で使用)
│   └── consequences.md                # (空テンプレートのまま)
├── evaluation/
│   └── quadrant.json                  ★ RDR-NAV の四象限評価
└── meta/
    ├── config.json                    ★ 更新済み（アクター構成等）
    └── session_log.md                 ★ 4シーン分のログ
```

### tests/

```
tests/
├── core/                              # (フェーズ0から変更なし)
├── llm/                               # (フェーズ0から変更なし)
├── actors/                            ★ 新規ディレクトリ
│   ├── chr.test.ts                    ★ CHR 行動提案テスト
│   ├── aut.test.ts                    ★ AUT 執筆テスト
│   └── edt.test.ts                    ★ EDT 設計・レビューテスト
├── orchestrator/                      ★ 新規ディレクトリ
│   └── pipeline.test.ts              ★ パイプライン結合テスト
└── integration/                       ★ 新規ディレクトリ
    └── core-loop.test.ts              ★ EDT→CHR→AUT→EDT の E2E テスト
```

---

## 1. アクター層

### 1.1 基底アクター

```typescript
// src/actors/base.ts

abstract class BaseActor {
  readonly id: ActorId;
  readonly type: ActorType;
  protected state: ActorOperatingState; // "active" | "dormant" | "standby"

  // 全アクター共通: LLMへの問い合わせ
  protected async invoke(prompt: string): Promise<ActorOutput> {
    return this.llm.complete(prompt);
  }

  // 活性化（休眠→活性）
  async activate(resumeSummary?: string): Promise<void>;

  // 休眠化
  async deactivate(): Promise<void>;
}
```

### 1.2 MVP で実装するアクター

| アクター | 入力 | 出力 | 特記事項 |
|---|---|---|---|
| **CHR-*** | HO-PUB, HO-PRV-自分, ST-CHR-自分, RCL-自分, シーンプロンプト, 他CHRの観測可能状態 | 行動提案 + 根拠引用 | MVP では ST-ORG/ST-NAT/ST-ENV 参照なし（アクター未実装） |
| **AUT** | HO-PUB, 全CHRの行動提案, 過去の確定済みシーン, EDTの演出指示 | シーン原稿(Markdown) | HO-PRV, HO-GM, ST-*, TRK-*, EVL-* を一切見ない |
| **EDT** | 全データ(HMN以外で最大可視範囲) | シーンプロンプト, レビュー結果, 活性化リスト | コンテキスト管理戦略をMVPで早期検証 |
| **RDR-NAV** | 現在のチャンク + 過去チャンクの記憶 + ペルソナ設定 | 感情タグ, 予測, 没入度, 四象限分類 | 創作完了後に実行。1ペルソナのみ |

### 1.3 EDT のコンテキスト管理戦略

EDT は全データ参照可能だが、毎回全データを渡すとコンテキスト長が爆発する。
フェーズ別に参照データを切り替える。

```
EDT のフェーズ別入力:

Phase A: シーン設計（シーン開始前）
  入力: HO-GM, TRK-FSH, TRK-TEN, TRK-ARC, ST-REL のサマリ, 前シーンの概要
  出力: シーンプロンプト + 活性化リスト

Phase B: アクター監督（シーン中）
  入力: 各アクターの出力（随時）
  出力: 承認/差し戻し

Phase C: レビュー（シーン完了後）
  入力: 完成原稿, HO-PUB, HO-PRV-*, ST-CHR-*（変更分のみ）
  出力: 承認/修正指示, 状態更新指示

Phase D: サイクル設計（インターリュード）
  入力: EVL-RPT, TRK-*, 全ST-*のサマリ, HO-GM
  出力: 次サイクルの設計
```

MVPではPhase A, B, C を実装。Phase D はフェーズ3以降。

---

## 2. シーン生成パイプライン

planning_doc.md セクション5.1 の STEP1-6 を実装する。

```typescript
// src/orchestrator/pipeline.ts

async function executeScenePipeline(
  sceneNumber: number,
  cycleContext: CycleContext,
): Promise<SceneResult> {
  // STEP 1: EDT がシーンプロンプト生成 + 活性化判定
  const scenePrompt = await edt.designScene(cycleContext);
  const activationList = await edt.determineActivation(scenePrompt);

  // STEP 2: 環境/所属アクターの状況出力（MVP では skip）

  // STEP 3: CHR-* が行動提案を生成（並列実行可）
  const actionProposals = await Promise.all(
    activationList.characters.map(chr =>
      chr.proposeAction(scenePrompt)
    )
  );

  // STEP 4: AUT がシーン原稿を執筆
  const draft = await aut.writeScene({
    scenePrompt,
    actionProposals,
  });

  // STEP 5: EDT がレビュー
  const review = await edt.reviewScene(draft);
  if (review.verdict === "revise") {
    // 修正ループ（最大3回）
    return await revisionLoop(draft, review, aut, edt);
  }

  // STEP 6: コミット
  await commitScene(draft, sceneNumber);

  return { draft, review };
}
```

### アクター活性化判定（MVP簡易版）

MVPでは CHR-* の活性化のみ。EDT がシーン設計時に登場キャラクターを決定する。

```typescript
// MVP簡易版
interface ActivationList {
  characters: CharacterActor[];  // EDT が指定した登場CHR-*
  // organizations, nations, env → MVP では未実装
}
```

---

## 3. recall 基本実装

MVPでは `recent.json` のみ使用。劣化処理はフェーズ3で追加。

```
recall/{actor_id}/
└── recent.json      # 全記憶をここに格納（MVPでは劣化なし）
```

```typescript
// 書き込み: シーン完了時に各 CHR-* の記憶を追記
// 読み取り: プロンプト組み立て時に全エントリを読み込み
```

---

## 4. Git コミット戦略（基本）

| コミットタイプ | メッセージ規約 | タイミング |
|---|---|---|
| シーン確定 | `scene(cycle-N/scene-M): <概要>` | EDT承認後 |
| 状態更新 | `state: update <対象> after scene-M` | シーン確定と同時 |
| recall更新 | `recall: update <actor_id>` | シーン確定と同時 |

MVP では pre-commit / post-commit hook は未実装。フェーズ2で追加。

---

## 5. CLI 基本コマンド

```bash
# 初期セットアップ
applicot init --genre fantasy --scale 3

# シーン生成
applicot scene next              # 次のシーンを生成
applicot scene run --cycle 1     # サイクル1を一括実行

# モニタリング
applicot status                  # 現在の状態概要
applicot actors                  # アクターの活性状態一覧
```

---

## 6. プロンプト組み立てと可視性フィルタ

```typescript
// src/prompts/builder.ts

async function buildActorPrompt(
  actorId: ActorId,
  sceneContext: SceneContext,
  store: StoreAccess,
  visibility: VisibilityEngine,
): Promise<string> {
  // 1. このアクターが参照可能な全データを収集
  const visibleData = await collectVisibleData(actorId, store, visibility);

  // 2. テンプレートに可視データのみを注入
  const prompt = await renderTemplate(actorId, visibleData, sceneContext);

  // 3. 最終検証: プロンプト内に非可視データの痕跡がないか
  const violations = visibility.detectViolations(prompt, [actorId]);
  if (violations.length > 0) {
    throw new VisibilityViolationError(violations);
  }

  return prompt;
}
```
