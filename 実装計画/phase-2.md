# フェーズ2: 情報遮断の完全実装

## 目的

可視性マトリクス（planning_doc.md セクション3）の全ルールを実装・検証する。

## 前提

フェーズ1のMVP（コアループ）が動作していること。

---

## 追加構成

```
アクター追加:
  - CHR-*: 2名 → 3-5名に拡大
  - ORG-*: 1-2（家族/組織）— 新規実装
  - NAT-*: 1（簡易版）— 新規実装
  - ENV: フル版 — 新規実装（MVP では EDT 直接記述だった）
```

## 作業一覧

- [ ] 条件付きアクセスの全ルール実装（役職レベル、諜報能力、3層国家情報）
- [ ] レベル2遮断の実装（EDT判断での例外的緩和 + META-EDT 記録 + 復元）
- [ ] レベル3遮断の実装（設定で切替可能）
- [ ] 情報開示イベントの実装（HO-PRV → HO-PUB 移行）
- [ ] 段階的情報開示の実装（秘密→噂→疑惑→確認→公知）
- [ ] pre-commit hook の情報遮断自動検証
- [ ] recall の情報源制限ラッパー
- [ ] ENV アクターの実装
- [ ] ORG-* アクターの実装
- [ ] NAT-* アクターの実装（簡易版）
- [ ] プロンプトテンプレート追加（ENV, ORG, NAT）

## 検証項目

- [ ] 可視性マトリクスの全セルが正しく動作
- [ ] 条件付きアクセスが正しく制御される（役職レベル、諜報能力等）
- [ ] 情報開示イベントで HO-PRV → HO-PUB の遷移が正常動作
- [ ] 段階的開示の5段階（秘密→噂→疑惑→確認→公知）が機能
- [ ] pre-commit hook が遮断違反を検出

## 実装規模

追加 約2000-3000行 + hook スクリプト

---

## ディレクトリ理想状態

フェーズ2完了時点。`★` はこのフェーズで新規追加。

### src/

```
src/
├── core/
│   ├── types/                         # (フェーズ0から変更なし)
│   ├── store/                         # (フェーズ0から変更なし)
│   └── visibility/
│       ├── engine.ts                  # 更新: 条件付きアクセス判定を追加
│       ├── rules.ts                   # 更新: レベル2・3ルール追加
│       ├── rules-conditional.ts       ★ 条件付きアクセスルール（役職/諜報/3層）
│       ├── disclosure.ts              ★ 情報開示イベント処理（段階的開示含む）
│       └── types.ts                   # 更新: DisclosureState, EdtOverride 追加
├── actors/
│   ├── base.ts                        # (フェーズ1から変更なし)
│   ├── chr.ts                         # 更新: ORG/NAT/ENV 入力対応
│   ├── aut.ts                         # (フェーズ1から変更なし)
│   ├── edt.ts                         # 更新: 緩和判断、開示イベント発動
│   ├── env.ts                         ★ ENV（環境アクター）
│   ├── nat.ts                         ★ NAT-*（国家アクター・簡易版）
│   ├── org.ts                         ★ ORG-*（組織アクター）
│   └── rdr.ts                         # (フェーズ1から変更なし)
├── orchestrator/
│   ├── pipeline.ts                    # 更新: STEP 2 に ENV/ORG/NAT 統合
│   └── activation.ts                  # 更新: ORG/NAT/ENV の活性化判定追加
├── git/
│   ├── commit.ts                      # 更新: disclosure, handout コミット種別追加
│   └── hooks/                         ★ 新規ディレクトリ
│       └── pre-commit.ts              ★ 情報遮断自動検証
├── llm/                               # (変更なし)
├── prompts/
│   ├── builder.ts                     # 更新: 条件付きアクセスのフィルタロジック
│   └── templates/
│       ├── chr-action.ts              # 更新: ORG/NAT/ENV 入力セクション追加
│       ├── aut-write.ts               # 更新: ENV/ORG/NAT レポート入力追加
│       ├── edt-design.ts              # (変更なし)
│       ├── edt-review.ts              # (変更なし)
│       ├── rdr-nav.ts                 # (変更なし)
│       ├── env-report.ts              ★ ENV 環境レポートテンプレート
│       ├── nat-report.ts              ★ NAT 国家レポートテンプレート
│       └── org-report.ts              ★ ORG 組織レポートテンプレート
└── cli/
    ├── scaffold.ts                    # (変更なし)
    └── index.ts                       # 更新: visibility コマンド追加
```

### novel/ — 3-5キャラクター + ORG/NAT/ENV 稼働後

```
novel/
├── handouts/
│   ├── public/
│   │   └── world.md                   # 更新: 国家・組織の公開情報追加
│   ├── private/
│   │   ├── chr_a.md
│   │   ├── chr_b.md
│   │   ├── chr_c.md                   ★ 追加キャラクター
│   │   ├── chr_d.md                   ★
│   │   └── chr_e.md                   ★ (3-5名)
│   └── gm/
│       ├── scenario.md                # 更新: ORG/NAT 関連の展開追加
│       ├── triggers.md                ★ トリガー条件
│       └── endings.md                 ★ エンディング分岐
├── state/
│   ├── characters/
│   │   ├── chr_a.json ... chr_e.json  ★ 3-5名分
│   ├── organizations/
│   │   ├── org_a1.json                ★ 組織1の状態
│   │   └── org_b1.json                ★ 組織2の状態 (1-2組織)
│   ├── nations/
│   │   └── nat_a/                     ★ 新規ディレクトリ
│   │       ├── public.json            ★ 公開層
│   │       ├── restricted.json        ★ 制限層
│   │       └── secret.json            ★ 非公開層
│   ├── environment.json               ★ ENV が出力した環境状態
│   ├── relationships.json             # 更新: 3-5名 + 組織の関係
│   ├── foreshadowing.json             # 更新
│   ├── tension_curve.json             # 更新
│   └── timeline.json                  # 更新: 可視性フラグ活用
├── scenes/
│   └── cycle_1/
│       └── scene_1.md ... scene_N.md
├── recall/
│   ├── chr_a/ ... chr_e/
│   │   └── recent.json
│   ├── env/                           ★
│   │   └── recent.json                ★
│   ├── org_a1/                        ★
│   │   └── recent.json                ★
│   └── nat_a/                         ★
│       └── recent.json                ★
├── campaign/
│   ├── arcs/
│   └── consequences.md
├── evaluation/
│   └── quadrant.json
└── meta/
    ├── config.json                    # 更新: アクター構成拡大
    ├── session_log.md
    └── editor_notes.md                ★ EDT の緩和判断記録
```

### tests/

```
tests/
├── core/
│   └── visibility/
│       ├── engine.test.ts             # 更新: 条件付きアクセステスト追加
│       ├── rules.test.ts              # 更新: レベル2・3テスト追加
│       ├── conditional.test.ts        ★ 役職レベル/諜報/3層テスト
│       └── disclosure.test.ts         ★ 情報開示イベントテスト
├── actors/
│   ├── env.test.ts                    ★
│   ├── nat.test.ts                    ★
│   └── org.test.ts                    ★
├── git/
│   └── hooks/
│       └── pre-commit.test.ts         ★ 遮断違反検出テスト
└── integration/
    ├── core-loop.test.ts
    └── visibility-matrix.test.ts      ★ 全セルの網羅テスト
```

---

## 1. 条件付きアクセスルールの完全実装

planning_doc.md セクション3.6 の全ルールを実装する。

### ST-CHR（キャラクター状態）の条件付きアクセス

```typescript
// CHR-A が CHR-B の状態を参照する場合
function canAccessCharacterState(
  requestor: ActorId,
  target: ActorId,
  field: "observable" | "internal",
): boolean {
  if (requestor === target) return true;           // 自分の状態は全参照可
  if (field === "observable") return true;          // 外部観測可能は誰でも
  return false;                                     // 内面は本人とEDTのみ
}
```

### ST-ORG（組織状態）の条件付きアクセス

```
CHR が所属組織を参照:
  一般構成員 → public 情報のみ
  幹部       → internal 情報まで
  指導者     → secret 情報含む全情報

CHR が非所属組織を参照 → 公式声明のみ

NAT が配下組織を参照 → 全情報
NAT が他国組織を参照 → 諜報能力に依存
```

### ST-NAT（国家状態）の条件付きアクセス

3層ファイル分離（`public.json` / `restricted.json` / `secret.json`）と連動。

```
公開層  → 全アクターから参照可
制限層  → 自国民 + 諜報取得可
非公開層 → EDT と HMN のみ
```

### ST-ENV（環境状態）の条件付きアクセス

```
体感可能（天候、気温、地震）  → その場にいる CHR-* が参照可
観測不能（長期気候変動、地殻変動） → ENV のみ全把握、NAT-* は観測技術依存
```

---

## 2. 遮断レベル2・3の実装

### レベル2: 原則遮断（EDT判断で例外的に緩和可能）

```typescript
// EDT による一時的緩和
interface EdtOverride {
  reason: string;           // "CHR-A has telepathy ability"
  scope: DataId[];          // 緩和対象のデータID
  grantedTo: ActorId;      // 緩和を受けるアクター
  expiresAfterScene: number; // このシーン完了後に復元
}
```

緩和手続き:
1. EDT が緩和の必要性を判断
2. 緩和理由と範囲を `META-EDT` に記録
3. 該当シーン完了後に自動で遮断を復元
4. 緩和履歴は Git で追跡可能

### レベル3: 推奨遮断

設定ファイル（`meta/config.json`）で切替可能。

---

## 3. 情報開示イベント

### 非公開ハンドアウトの公開化

```
トリガー: 物語内でキャラクターの秘密が暴露される

処理:
  1. EDT が「情報開示イベント」を宣言
  2. HO-PRV-X の該当部分を HO-PUB に移動
  3. Git コミット: "disclosure: <秘密の概要> revealed"
  4. 全活性 CHR-* の recall に「この情報を知った」記憶を追加
  5. 読者アクターの予測照合が発火（驚きか安心かの判定）
```

### 段階的情報開示

```
完全秘密 → 噂レベル → 疑惑レベル → 確認済み → 公知

各段階で参照可能なアクターが拡大:
  完全秘密:  HO-PRV-X に記載。CHR-X と EDT のみ
  噂レベル:  一部 CHR-* の recall に「〜らしい」として追加
  疑惑レベル: 関連 ORG-* が認知。CHR-* の一部が調査開始
  確認済み:  関連 NAT-* が認知。対応を検討
  公知:      HO-PUB に移動。全アクター参照可
```

段階はデータ内のメタフィールドとして管理:
```typescript
interface DisclosureState {
  secretId: string;
  currentStage: "secret" | "rumor" | "suspicion" | "confirmed" | "public";
  knownBy: ActorId[];       // 現段階で知っているアクター
  history: DisclosureEvent[]; // 段階遷移の履歴
}
```

---

## 4. pre-commit hook

```bash
# novel/.git/hooks/pre-commit → Bunスクリプトを呼び出し
bun run src/git/hooks/pre-commit.ts
```

チェック項目:
- **情報遮断検証**: シーン原稿内に、その時点で公開されていない情報への言及がないか
- **キャラクター知識整合性**: キャラクターの行動が、そのキャラクターが知りえない情報に基づいていないか
- **タイムライン整合性**: 未来の出来事への言及がないか
- **休眠整合性**: 休眠中のキャラクターが能動的に行動していないか
- **recall 情報源検証**: 不正な情報源からの記憶がないか

違反時の処理:
- コミット拒否 + 違反内容の表示
- EDT に修正を要求

---

## 5. recall の情報源制限ラッパー

```typescript
// 書き込み時チェック
async function writeRecall(
  actorId: ActorId,
  memory: Memory,
  source: MemorySource,
  visibility: VisibilityEngine,
): Promise<void> {
  // このアクターがこの情報源にアクセスできるか検証
  if (!visibility.canAccess(actorId, source.dataId)) {
    throw new RecallViolationError(
      `${actorId} cannot form memory from ${source.dataId}`
    );
  }
  // OK → ファイルに書き込み
  await appendToRecallFile(actorId, memory);
}
```

---

## 6. 新規アクター実装

### ENV（環境アクター）

```
入力:  HO-PUB, ST-ENV, RCL-ENV
出力:  環境状況レポート（天候、自然現象、環境変化）

稼働: サイクルに1-2回 + 緊急時のみ活性
休眠中: 直前の出力が継続有効。EDT がシーンプロンプトに「環境メモ」として転記
```

### ORG-*（組織アクター）

```
入力:  HO-PUB, ST-ORG-自分, ST-NAT-所属国(制限層まで), RCL-自分
出力:  組織状況レポート（組織の動向、内部派閥の力学）

稼働: 3-5シーンに1回 + 緊急時
内部派閥: 活性時でも関連派閥のみ活性化（EDT指定）
```

### NAT-*（国家アクター・簡易版）

```
入力:  HO-PUB, ST-NAT-自分(全層), ST-NAT-他(公開層), ST-ORG-配下, RCL-自分
出力:  国家状況レポート（政策動向、軍事動向、外交姿勢）

稼働: サイクル内2-4回（起承転結の境界付近）+ 緊急時
簡易版: 戦時特殊ルール（更新頻度上昇）は未実装 → フェーズ3
```
