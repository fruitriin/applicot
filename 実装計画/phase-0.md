# フェーズ0: 基盤整備

## 目的

実装に必要なスキーマ・型定義・基盤コードの整備。
以降の全フェーズが依存する土台を構築する。

---

## 作業一覧

- [ ] Bun プロジェクト初期化（package.json, tsconfig.json, bunfig.toml）
- [ ] 全データ型の TypeScript 定義 + zod スキーマ
- [ ] ファイルシステムストア層の実装（CRUD + ファイル配置規約）
- [ ] 情報可視性エンジンのコア実装（ルール定義 + 判定ロジック）
- [ ] LLM アダプタ層の実装（Anthropic SDK ラッパー）
- [ ] プロンプトテンプレートの初版（CHR, AUT, EDT の3種）
- [ ] novel/ ディレクトリのスキャフォールド生成コマンド

## 成果物

- 型定義とバリデーション
- Store の read/write/list が動作
- 可視性エンジンのユニットテスト
- LLM 呼び出しの動作確認

---

## ディレクトリ理想状態

フェーズ0完了時点。全ファイルが新規。

### src/ — アプリケーションコード

```
src/
├── core/
│   ├── types/
│   │   ├── ids.ts                    # ActorId, DataId 等の識別子型
│   │   ├── actor.ts                  # ActorType, ActorOperatingState
│   │   ├── character-state.ts        # CharacterStateSchema (zod)
│   │   ├── organization-state.ts     # OrganizationStateSchema
│   │   ├── nation-state.ts           # NationStateSchema（3層）
│   │   ├── environment-state.ts      # EnvironmentStateSchema
│   │   ├── relationship.ts           # RelationshipSchema（有向グラフ）
│   │   ├── foreshadowing.ts          # ForeshadowingEntrySchema
│   │   ├── timeline.ts              # TimelineEventSchema
│   │   ├── evaluation.ts             # EvaluationQuadrantSchema
│   │   ├── recall.ts                 # RecallMemorySchema
│   │   └── index.ts                  # 全型の re-export
│   ├── store/
│   │   ├── store.ts                  # StoreAccess インターフェース + 実装
│   │   ├── json-store.ts             # JSON ファイルの読み書き
│   │   ├── markdown-store.ts         # Markdown ファイルの読み書き
│   │   └── paths.ts                  # ファイル配置規約（DataId → ファイルパス）
│   └── visibility/
│       ├── engine.ts                 # VisibilityEngine インターフェース + 実装
│       ├── rules.ts                  # レベル1 絶対遮断ルール定義
│       └── types.ts                  # BarrierRule, AccessContext 等
├── llm/
│   ├── adapter.ts                    # LLMAdapter インターフェース
│   └── anthropic.ts                  # Anthropic SDK 実装
├── prompts/
│   ├── builder.ts                    # プロンプト組み立て + 可視性フィルタ
│   └── templates/
│       ├── chr-action.ts             # CHR-* 行動提案テンプレート
│       ├── aut-write.ts              # AUT シーン執筆テンプレート
│       └── edt-design.ts             # EDT シーン設計テンプレート
└── cli/
    └── scaffold.ts                   # novel/ ディレクトリ生成コマンド
```

### novel/ — 物語データスキャフォールド

`applicot init` で生成される空のディレクトリ構造。

```
novel/
├── handouts/
│   ├── public/                       # (空 — フェーズ1で .md を配置)
│   ├── private/                      # (空)
│   └── gm/                           # (空)
├── state/
│   ├── characters/                   # (空)
│   ├── organizations/                # (空)
│   ├── nations/                      # (空)
│   ├── environment.json              # 初期値: {}
│   ├── relationships.json            # 初期値: { "edges": [] }
│   ├── foreshadowing.json            # 初期値: []
│   ├── tension_curve.json            # 初期値: []
│   └── timeline.json                 # 初期値: []
├── scenes/                           # (空)
├── recall/                           # (空)
├── campaign/
│   ├── arcs/                         # (空)
│   └── consequences.md               # 初期値: 空テンプレート
├── evaluation/                       # (空)
└── meta/
    ├── config.json                   # システム設定（ジャンル、スケール等）
    └── session_log.md                # 初期値: 空
```

### tests/

```
tests/
├── core/
│   ├── store/
│   │   ├── json-store.test.ts        # JSON 読み書きテスト
│   │   └── markdown-store.test.ts    # Markdown 読み書きテスト
│   └── visibility/
│       ├── engine.test.ts            # 可視性判定テスト
│       └── rules.test.ts             # レベル1ルールテスト
└── llm/
    └── anthropic.test.ts             # LLM 呼び出しテスト
```

### ルート

```
applicot/
├── package.json
├── tsconfig.json
├── bunfig.toml
├── .gitignore
├── planning_doc.md
├── プロジェクトゴール.md
├── 実装計画.md
└── 実装計画/
    └── phase-0.md ... phase-5.md
```

---

## 1. データストア層

### 1.1 ファイルシステムストア設計

全データストアへのアクセスを統一的に扱う `Store` 層を実装する。

```typescript
// src/core/store/store.ts の概念設計

interface StoreConfig {
  novelRoot: string;  // e.g. "./novel"
}

// 各データストアごとにリーダー/ライターを提供
// 読み取り時に可視性チェックを挟む
interface StoreAccess {
  read(dataId: DataId, actorId: ActorId): Promise<Data | null>;  // 可視性違反→null
  write(dataId: DataId, actorId: ActorId, data: Data): Promise<void>;  // 権限違反→throw
  list(storeType: StoreType, actorId: ActorId): Promise<DataId[]>;  // 可視なもののみ
}
```

### 1.2 データフォーマット定義

| データ | フォーマット | ファイル配置 | 理由 |
|---|---|---|---|
| HO-PUB | Markdown | `handouts/public/*.md` | 人間可読、diff容易 |
| HO-PRV-* | Markdown | `handouts/private/{chr_id}.md` | キャラクターごとに分離 |
| HO-GM | Markdown（3ファイル） | `handouts/gm/{scenario,triggers,endings}.md` | 役割ごとに分離 |
| ST-CHR | JSON | `state/characters/{chr_id}.json` | 構造化データ。キャラクターごとにファイル分離（diff粒度向上） |
| ST-ORG | JSON | `state/organizations/{org_id}.json` | 同上 |
| ST-NAT | JSON（3層） | `state/nations/{nat_id}/{public,restricted,secret}.json` | 情報層ごとにファイル分離。可視性制御がファイル単位で可能 |
| ST-ENV | JSON | `state/environment.json` | 単一ファイル（ENVは1インスタンス） |
| ST-REL | JSON | `state/relationships.json` | グラフ構造。隣接リスト形式 |
| TRK-FSH | JSON | `state/foreshadowing.json` | 伏線エントリの配列 |
| TRK-TEN | JSON | `state/tension_curve.json` | シーンごとの緊張度値の配列 |
| TRK-TML | JSON | `state/timeline.json` | イベント配列。各イベントに可視性フラグ |
| TRK-CSQ | Markdown | `campaign/consequences.md` | 人間可読、narrative性が高い |
| TRK-ARC | Markdown | `campaign/arcs/{chr_id}.md` | キャラクターごと |
| OUT-SCN | Markdown | `scenes/cycle_{n}/scene_{m}.md` | サイクル/シーン番号で整理 |
| EVL-* | JSON | `evaluation/{type}.json` | 構造化データ |
| EVL-RPT | Markdown | `evaluation/report.md` | EDT向けサマリ |
| RCL-* | JSON（階層化） | `recall/{actor_id}/{recent,mid,long}.json` | 記憶の時間層ごとに分離 |
| META-* | JSON/Markdown | `meta/` | 種別に応じて |

**設計判断: 状態ファイルはエンティティ単位で分割する。**
`state/characters/chr_a.json` と `state/characters/chr_b.json` を分けることで、
git diff が「CHR-A の状態だけ変わった」を明示する。

### 1.3 JSON Schema 定義

`src/core/types/` に TypeScript 型定義を置き、そこから JSON Schema を生成する。
ランタイムバリデーションには `zod` を使用。

```typescript
// src/core/types/character-state.ts の例
import { z } from "zod";

export const CharacterStateSchema = z.object({
  id: z.string(),               // "chr_a"
  name: z.string(),
  alive: z.boolean(),
  location: z.string(),
  // 外部観測可能
  observable: z.object({
    appearance: z.string(),
    publicTitle: z.string(),
    visibleCondition: z.string(),  // "健康" | "負傷" | "疲弊" 等
  }),
  // 内面（本人とEDTのみ）
  internal: z.object({
    stress: z.number().min(0).max(100),
    loyalty: z.record(z.string(), z.number()),   // { "org_a1": 80, "nat_a": 60 }
    desires: z.record(z.string(), z.number()),   // { "safety": 70, "justice": 90 }
    secretMotivation: z.string().optional(),
  }),
  // 所属
  affiliations: z.array(z.object({
    entityId: z.string(),        // "org_a1" | "nat_a"
    role: z.string(),            // "member" | "officer" | "leader"
    accessLevel: z.enum(["public", "internal", "secret"]),
  })),
});

export type CharacterState = z.infer<typeof CharacterStateSchema>;
```

定義するスキーマ一覧:
- `CharacterStateSchema` — 上記
- `OrganizationStateSchema` — 内部派閥モデル含む
- `NationStateSchema` — 3層（public / restricted / secret）
- `EnvironmentStateSchema` — サブシステム別（天候/季節/地理/生態系/魔法体系）
- `RelationshipSchema` — 有向グラフ。関係タイプ（同盟/敵対/家族/恋愛等）+ 重み
- `ForeshadowingEntrySchema` — 伏線のライフサイクル（planted → growing → harvested | abandoned）
- `TimelineEventSchema` — 可視性フラグ（public / restricted / hidden）付き
- `EvaluationQuadrantSchema` — 四象限分類（良い驚き/悪い驚き/良い安心/悪い安心）
- `RecallMemorySchema` — 階層化記憶（recent / mid-term / long-term）

---

## 2. 情報可視性エンジン（コア）

**このシステムの最も重要なコンポーネント。** 全データアクセスはここを通る。

### 2.1 設計

```typescript
// src/core/visibility/engine.ts

interface VisibilityEngine {
  // あるアクターがあるデータにアクセス可能か判定
  canAccess(actorId: ActorId, dataId: DataId, context?: AccessContext): boolean;

  // あるアクター向けにフィルタされたデータを返す
  filterForActor(actorId: ActorId, data: Data): FilteredData;

  // 可視性違反を検出（pre-commit hookで使用）
  detectViolations(sceneContent: string, actorStates: ActorState[]): Violation[];
}

// アクセスコンテキスト（条件付きアクセスの判定に使用）
interface AccessContext {
  actorAffiliations?: Affiliation[];  // 所属情報（役職レベル判定用）
  espionageCapability?: number;       // 諜報能力（NAT間情報取得用）
  edtOverride?: {                     // EDT による一時的緩和
    reason: string;
    scope: string;
    expiresAfterScene: number;
  };
}
```

### 2.2 可視性ルールの実装

planning_doc.md セクション3のマトリクスを、宣言的なルール定義として実装する。
フェーズ0ではレベル1（絶対遮断）のみ実装。レベル2・3はフェーズ2で追加。

```typescript
// src/core/visibility/rules.ts

// レベル1: 絶対遮断（コードレベルでハードコード。設定変更不可）
const ABSOLUTE_BARRIERS: BarrierRule[] = [
  { actor: "CHR-*", data: "HO-PRV-*", condition: "not_own", level: 1 },
  { actor: "CHR-*", data: "HO-GM",    condition: "always",  level: 1 },
  { actor: "AUT",   data: "HO-PRV-*", condition: "always",  level: 1 },
  { actor: "AUT",   data: "HO-GM",    condition: "always",  level: 1 },
  { actor: "RDR-*", data: "HO-*",     condition: "always",  level: 1 },
  { actor: "RDR-*", data: "OUT-SCN",  condition: "unread",  level: 1 },
  { actor: "creative_actors", data: "EVL-*", condition: "always", level: 1 },
  { actor: "RDR-*", data: "RDR-*",    condition: "not_own", level: 1 },
];

// レベル2, 3 → フェーズ2で追加
```

---

## 3. LLM アダプタ層

```typescript
// src/llm/adapter.ts

interface LLMAdapter {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  // 将来的にストリーミング対応も追加
}

interface CompletionOptions {
  model?: string;       // "claude-sonnet-4-6" | "claude-opus-4-6" | "claude-haiku-4-5"
  maxTokens?: number;
  temperature?: number;
}

// src/llm/anthropic.ts — Anthropic SDK を使った Claude 実装
```

アクター種別によるモデル使い分け（推奨）:
| アクター | モデル | 理由 |
|---|---|---|
| EDT | Opus | 全データ参照の複雑な判断 |
| CHR-* / AUT | Sonnet | 創作品質とコストのバランス |
| RDR-* | Haiku | 評価タスクは軽量でよい |
| recall 要約 | Haiku | コスト抑制 |
