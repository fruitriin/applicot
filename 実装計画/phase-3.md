# フェーズ3: 多層世界と評価系の完全実装

## 目的

ENV/NAT/ORG の階層構造と読者評価の全機能を実装する。

## 前提

フェーズ2の情報遮断が完全に動作していること。

---

## 追加構成

```
アクター拡張:
  - ENV: サブシステム別更新（天候/季節/地理/生態系/魔法体系）
  - NAT-*: 複数国家。3層情報モデルのフル実装。戦時特殊ルール
  - ORG-*: 内部派閥モデル。複数組織
  - RDR-*: 4ペルソナ全実装（RDR-ANA, RDR-EMO, RDR-CRT, RDR-NAV）
```

## 作業一覧

- [ ] タイムスケール設計の全ルール実装（活性/休眠/待機の完全3状態モデル）
- [ ] 緊急活性化カスケード（深さ制限3段階: ENV→NAT→ORG→CHR）
- [ ] NAT-* フル実装（戦時特殊ルール、待機モード含む）
- [ ] ORG-* フル実装（内部派閥モデル）
- [ ] ENV サブシステム別更新
- [ ] RDR-ANA, RDR-EMO, RDR-CRT の実装
- [ ] 四象限評価のフル実装
- [ ] 層間コントラスト測定
- [ ] ペルソナ間不一致検出
- [ ] recall の記憶劣化処理（recent → midterm → longterm 自動圧縮）
- [ ] post-commit hook（recall 自動圧縮 + 状態整合性更新）
- [ ] 評価レポート生成 → EDT フィードバック

## 実装規模

追加 約3000-5000行 + 評価アルゴリズム

---

## ディレクトリ理想状態

フェーズ3完了時点。`★` はこのフェーズで新規追加。

### src/

```
src/
├── core/
│   ├── types/
│   │   └── evaluation.ts              # 更新: 層間コントラスト、ペルソナ不一致型追加
│   ├── store/                         # (変更なし)
│   └── visibility/                    # (変更なし)
├── actors/
│   ├── base.ts                        # 更新: standby 状態の完全実装
│   ├── chr.ts                         # (変更なし)
│   ├── aut.ts                         # (変更なし)
│   ├── edt.ts                         # 更新: カスケード判定、EVL-RPT 参照
│   ├── env.ts                         # 更新: サブシステム別更新
│   ├── nat.ts                         # 更新: 戦時特殊ルール、待機モード
│   ├── org.ts                         # 更新: 内部派閥モデル
│   └── rdr.ts                         # 更新: 4ペルソナ全実装 (ANA/EMO/CRT/NAV)
├── orchestrator/
│   ├── pipeline.ts                    # 更新: フル版パイプライン（全アクター統合）
│   ├── activation.ts                  # 更新: 3状態モデル完全実装
│   ├── cascade.ts                     ★ 緊急活性化カスケード（深さ制限3段階）
│   └── evaluation.ts                  ★ 読者評価パイプライン
├── recall/                            ★ 新規ディレクトリ（recall ロジックを actors/ から分離）
│   ├── store.ts                       ★ 4層ファイル管理 (recent/midterm/longterm/pinned)
│   └── degradation.ts                 ★ 記憶劣化処理（LLM要約による圧縮）
├── git/
│   ├── commit.ts                      # (変更なし)
│   └── hooks/
│       ├── pre-commit.ts              # (変更なし)
│       └── post-commit.ts             ★ recall 自動圧縮 + 状態整合性更新
├── llm/                               # (変更なし)
├── prompts/
│   ├── builder.ts                     # (変更なし)
│   └── templates/
│       ├── (既存テンプレート群)
│       ├── rdr-ana.ts                 ★ RDR-ANA 分析的読者テンプレート
│       ├── rdr-emo.ts                 ★ RDR-EMO 感情的読者テンプレート
│       ├── rdr-crt.ts                 ★ RDR-CRT 批評的読者テンプレート
│       ├── edt-cascade.ts             ★ EDT カスケード影響範囲判定テンプレート
│       └── edt-cycle-review.ts        ★ EDT サイクル完了レビューテンプレート
└── cli/
    └── index.ts                       # 更新: evaluate, report コマンド追加
```

### novel/ — 複数国家・組織 + 4ペルソナ評価後

```
novel/
├── handouts/                          # (構造はフェーズ2と同じ。内容が拡充)
├── state/
│   ├── characters/
│   │   └── chr_a.json ... chr_e.json
│   ├── organizations/
│   │   ├── org_a1.json                # 更新: 内部派閥データ追加
│   │   ├── org_b1.json
│   │   └── org_a2.json                ★ 追加組織
│   ├── nations/
│   │   ├── nat_a/
│   │   │   ├── public.json
│   │   │   ├── restricted.json
│   │   │   └── secret.json
│   │   └── nat_b/                     ★ 複数国家
│   │       ├── public.json            ★
│   │       ├── restricted.json        ★
│   │       └── secret.json            ★
│   ├── environment.json               # 更新: サブシステム別データ
│   ├── relationships.json
│   ├── foreshadowing.json
│   ├── tension_curve.json
│   └── timeline.json
├── scenes/
│   └── cycle_1/ ... cycle_N/
├── recall/
│   ├── chr_a/
│   │   ├── recent.json
│   │   ├── midterm.json               ★ 記憶劣化で生成
│   │   ├── longterm.json              ★ 記憶劣化で生成
│   │   └── pinned.json                ★ 強い感情の永続記憶
│   ├── chr_b/ ... chr_e/              # (同構造)
│   ├── env/
│   │   └── recent.json ... pinned.json
│   ├── org_a1/ ... org_a2/
│   │   └── recent.json ... pinned.json
│   └── nat_a/ ... nat_b/
│       └── recent.json ... pinned.json
├── campaign/
│   ├── arcs/
│   └── consequences.md
├── evaluation/
│   ├── quadrant.json                  # 更新: 4ペルソナ分のデータ
│   ├── emotions.json                  ★ 感情タグ記録
│   ├── predictions.json               ★ 予測・照合記録
│   ├── layer_contrast.json            ★ 層間コントラスト
│   └── report.md                      ★ 評価レポート（EDT 参照用）
└── meta/
    ├── config.json
    ├── session_log.md
    └── editor_notes.md
```

### tests/

```
tests/
├── core/                              # (変更なし)
├── actors/
│   ├── (既存テスト)
│   └── rdr-personas.test.ts           ★ 4ペルソナの独立性テスト
├── orchestrator/
│   ├── pipeline.test.ts               # 更新: フル版パイプラインテスト
│   ├── cascade.test.ts                ★ カスケード深さ制限テスト
│   └── evaluation.test.ts             ★ 評価パイプラインテスト
├── recall/                            ★ 新規ディレクトリ
│   ├── degradation.test.ts            ★ 記憶劣化テスト
│   └── source-restriction.test.ts     ★ 情報源制限テスト（フェーズ2から移動）
├── git/
│   └── hooks/
│       ├── pre-commit.test.ts
│       └── post-commit.test.ts        ★
└── integration/
    ├── core-loop.test.ts
    ├── visibility-matrix.test.ts
    └── full-cycle.test.ts             ★ フルサイクル E2E テスト
```

---

## 1. タイムスケール設計の完全実装

### 3状態モデル

| 状態 | 意味 | API呼び出し | 情報取得 | 出力生成 | 状態変化 |
|---|---|:---:|:---:|:---:|:---:|
| **活性（Active）** | 現在のシーン/フェーズに参加中 | あり | あり | あり | あり |
| **休眠（Dormant）** | 存在するが現在のシーンに無関係 | なし | なし | なし | なし |
| **待機（Standby）** | 活性化トリガーを監視中 | 最小限 | トリガー情報のみ | なし | なし |

### 休眠アクターの制約（完全実装）

```
ルール1: 休眠アクターは情報を取得しない
ルール2: 休眠アクターの状態は凍結される
ルール3: 休眠アクターについて他アクターが言及できるのは recall 範囲内の推測のみ
ルール4: 長期休眠（5シーン以上）からの復帰時は EDT が経過サマリを生成
ルール5: 組織・国家の休眠は「時間の遅延」として表現（能動的な重大判断は行わない）
```

### アクター活性化判定（フル版）

```typescript
// src/orchestrator/activation.ts

interface ActivationList {
  characters: CharacterActor[];      // 活性CHR-*（限定活性含む）
  organizations: OrganizationActor[];
  nations: NationActor[];
  env: boolean;
}

async function determineActivation(
  sceneDesign: SceneDesign,
  worldState: WorldState,
  cyclePosition: CyclePosition,
): Promise<ActivationList> {
  // STEP 2: 登場キャラクター判定
  //   物理的にその場にいる CHR-* → 活性
  //   遠隔介入する CHR-* → 限定活性

  // STEP 3: 組織の関与判定
  //   直接関連 or 定期更新間隔到達 → 活性
  //   関連派閥のみ活性化（EDT指定）

  // STEP 4: 国家の関与判定
  //   転換点 or 国家イベント or 戦時更新間隔 → 活性
  //   戦時: 更新頻度上昇（毎シーン〜2シーンに1回）

  // STEP 5: 環境の関与判定
  //   サイクル開始 or 環境イベント → 活性
}
```

---

## 2. 緊急活性化カスケード

planning_doc.md セクション4.6。**深さ制限3段階。**

```
例: 地震の発生

1. EDT が ENV の緊急活性化を決定
2. ENV が「大規模地震。主要都市に被害」を出力
3. EDT が影響範囲を判定:
   → NAT-A（被災国）を緊急活性化
   → NAT-B（隣国）を待機→活性に変更
   → ORG-A1（被災地の組織）を緊急活性化
   → 被災地にいる CHR-* を全員活性化
   → 被災地にいない CHR-* は休眠維持
4. 各活性化アクターが反応を生成
5. AUT がシーンを執筆

カスケードの深さ制限: 最大3段階
  ENV → NAT → ORG → CHR（ここで止める）
```

```typescript
// src/orchestrator/cascade.ts

async function executeCascade(
  trigger: CascadeTrigger,
  edt: EditorActor,
  maxDepth: number = 3,
): Promise<ActivationList> {
  let currentDepth = 0;
  let activationQueue: ActorId[] = [trigger.sourceActorId];
  const activated: Set<ActorId> = new Set();

  while (activationQueue.length > 0 && currentDepth < maxDepth) {
    const nextQueue: ActorId[] = [];
    for (const actorId of activationQueue) {
      if (activated.has(actorId)) continue;
      activated.add(actorId);
      // EDT が影響範囲を判定
      const impacted = await edt.assessCascadeImpact(actorId, trigger);
      nextQueue.push(...impacted);
    }
    activationQueue = nextQueue;
    currentDepth++;
  }

  return buildActivationList(activated);
}
```

---

## 3. 読者評価パイプライン（フル実装）

planning_doc.md セクション5.2。

### 4ペルソナの実装

| ペルソナ | 評価の焦点 | 特性 |
|---|---|---|
| **RDR-ANA** | 構造分析、伏線検出、整合性チェック | 「なるほど、この伏線はここに繋がるのか」 |
| **RDR-EMO** | 感情反応、共感度、没入度 | 「このシーンで涙が出た」 |
| **RDR-CRT** | 批評的評価、文体、テーマ | 「この表現は陳腐だ」 |
| **RDR-NAV** | 素朴な読書体験、面白さ、退屈度 | 「次が気になる！」「ちょっと退屈...」 |

### 評価フロー

```
STEP 1: 完成原稿をチャンク分割（2000文字単位）

STEP 2: 各 RDR-* が逐次読書
  ※ 全 RDR-* に共通の制約:
    - 未読チャンクは見えない（先読み禁止）
    - ハンドアウトは一切見えない
    - 状態データは一切見えない
    - 他の RDR-* の評価は見えない

STEP 3: 評価集計
  含む: 四象限分布, 感情曲線, 没入度曲線, 層間コントラスト,
       ペルソナ間不一致, 起承転結パターン適合度

STEP 4: EDT へのフィードバック（EVL-RPT 生成）
  ※ EVL-RPT は AUT, CHR-*, ENV, NAT-*, ORG-* には見えない
```

### 四象限分類

```
         驚いた
          |
  悪い驚き | 良い驚き
          |
安心でない--+--安心
          |
  悪い安心 | 良い安心
          |
        予想通り
```

### 層間コントラスト測定

「表面に見えていること」と「裏で起きていること」の差分を数値化。
- 表面: AUT が書いたシーン原稿からの印象
- 裏: EDT が知っている実際の状況（HO-PRV, TRK-FSH 等）
- コントラスト値 = 表面の印象と裏の事実の乖離度

### ペルソナ間不一致検出

4ペルソナの評価が大きく異なる箇所を検出。
- 「RDR-EMO は感動したが RDR-CRT は陳腐と評価」→ 演出の質を要検討
- 「RDR-ANA は伏線を検出したが RDR-NAV は見逃した」→ 伏線の隠蔽度が適切

---

## 4. recall の記憶劣化処理

### ファイル構造（フル版）

```
recall/{actor_id}/
├── recent.json      # 直近1-2シーン: 詳細な記録
├── midterm.json     # 5-10シーン前: 要約レベル
├── longterm.json    # 10シーン以上前: キーワード+感情タグ
└── pinned.json      # 永続記憶: トラウマ、決定的出会い等
```

### 劣化処理フロー

```
新規記憶 → recent.json に追記
シーン進行時:
  recent の古いエントリ → LLM(Haiku)で要約 → midterm に移動
  midterm の古いエントリ → キーワード+感情タグに圧縮 → longterm に移動
  pinned のエントリ → 劣化しない

例外: 強い感情を伴う記憶は pinned に移動（劣化なし）
  → 「トラウマ」「決定的な出会い」等
```

---

## 5. post-commit hook

```bash
# novel/.git/hooks/post-commit → Bunスクリプトを呼び出し
bun run src/git/hooks/post-commit.ts
```

処理内容:
- **recall の自動圧縮**: 記憶劣化処理のトリガー
- **状態データの整合性更新**: シーン結果に基づく ST-* の自動更新

---

## 6. シーン生成パイプライン（フル版）

フェーズ1のMVPパイプラインを拡張し、全アクターを統合。

```typescript
async function executeScenePipeline(
  sceneNumber: number,
  cycleContext: CycleContext,
): Promise<SceneResult> {
  // STEP 1: EDT がシーンプロンプト生成 + 活性化判定
  const scenePrompt = await edt.designScene(cycleContext);
  const activationList = await edt.determineActivation(scenePrompt);

  // STEP 2: 環境/所属アクターの状況出力（活性のもののみ）
  const envReport = activationList.env
    ? await env.generateReport(scenePrompt)
    : null;
  const orgReports = await Promise.all(
    activationList.orgs.map(org => org.generateReport(scenePrompt))
  );
  const natReports = await Promise.all(
    activationList.nations.map(nat => nat.generateReport(scenePrompt))
  );

  // STEP 3: CHR-* が行動提案を生成（並列実行可）
  const actionProposals = await Promise.all(
    activationList.characters.map(chr =>
      chr.proposeAction(scenePrompt, envReport, orgReports, natReports)
    )
  );

  // STEP 4: AUT がシーン原稿を執筆
  const draft = await aut.writeScene({
    scenePrompt, actionProposals,
    envReport, orgReports, natReports,
  });

  // STEP 5: EDT がレビュー
  const review = await edt.reviewScene(draft);
  if (review.verdict === "revise") {
    return await revisionLoop(draft, review, aut, edt);
  }

  // STEP 6: コミット
  await commitScene(draft, sceneNumber);

  return { draft, review };
}
```
