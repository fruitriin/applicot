# フェーズ0.5: recall システム — Bun + コミット可能ファイルシステム

## 目的

[embodied-claude/memory-mcp](https://github.com/lifemate-ai/embodied-claude/tree/main/memory-mcp)
の設計思想を参考に、**ファイルシステムベース・git-diffable** な記憶システムを Bun で実装する。

memory-mcp は SQLite + NumPy ベクトル + Hopfield ネットワークを使った神経科学インスパイアの記憶システム。
本フェーズではその概念モデルを活かしつつ、ストレージをファイルシステムに置き換える。

## 前提

- フェーズ0の成果物（型定義、Store基盤、可視性エンジンコア、LLMアダプタ）が完成していること。
- **ツール（applicot）と物語データ（novel）は別の Git リポジトリ。相互にバージョンを参照しない。**

---

## Git リポジトリ分離とrecallの関係

```
~/workspace/
├── applicot/              # Git リポジトリ A: ツール本体
│   ├── .git/              # applicot のバージョン管理
│   ├── src/
│   │   └── recall/        # recall エンジンのコード（ここで実装する）
│   └── tests/
│
└── my-novel/              # Git リポジトリ B: 物語データ
    ├── .git/              # 物語のバージョン管理（recall データ含む）
    └── recall/            # recall データファイル（ここに書き込む）
        ├── chr_a/
        ├── chr_b/
        └── ...
```

```
原則:
  - src/recall/ のコードは novel/ のパスを知らない（実行時に注入）
  - novel/recall/ のデータは applicot のバージョンを知らない
  - recall エンジンは「任意のディレクトリを指定されたら、
    そこに記憶を読み書きする」という純粋なライブラリ
  - コミット操作は呼び出し側（orchestrator）が行う。
    recall エンジン自体は git を呼ばない
```

---

## 作業一覧

- [ ] recall データモデル設計（memory-mcp 概念のファイルシステムへの写像）
- [ ] RecallStore 実装（Bun ファイルI/O による CRUD）
- [ ] メモリエントリの zod スキーマ定義
- [ ] 連想リンク（associations）の実装
- [ ] エピソード（シーン単位のグルーピング）の実装
- [ ] 記憶統合（consolidation）の実装 — LLM ベースの要約圧縮
- [ ] 情報源制限ラッパー（可視性エンジン連携）
- [ ] ランタイムインデックス（検索用インメモリキャッシュ）
- [ ] ユニットテスト

## 実装規模

約800-1200行 + テスト

---

## memory-mcp からの借用と変換

### 借用する概念

| memory-mcp の概念 | Applicot での実装 | 変換理由 |
|---|---|---|
| SQLite memories テーブル | JSON ファイル（層別） | git diff 可読性 |
| embeddings (E5 ベクトル) | **不採用** → キーワード + LLM 検索 | 依存最小化。ベクトル DB 不要 |
| BM25 キーワード検索 | tags + ランタイムインデックス | ファイルベースで十分 |
| Hopfield ネットワーク | **不採用** → 連想リンクのグラフ走査 | ファイルシステムに自然に表現可能 |
| coactivation (共活性化) | associations.json のリンク重み | git diff で関係の変化が追跡可能 |
| episodes | episodes.json（シーン単位） | 物語の構造と自然に対応 |
| consolidation (統合) | LLM 要約による層間移動 | 元の設計を踏襲しつつ LLM で実行 |
| working memory (20件バッファ) | recent.json + ランタイムキャッシュ | ファイル = 永続、キャッシュ = セッション |
| importance (重要度) | importance フィールド（1-10） | そのまま採用 |
| emotion (感情タグ) | emotion フィールド | そのまま採用 |
| sensory memory (画像/音声) | **不採用** | テキスト小説に不要 |
| predictive coding (予測誤差) | **フェーズ3で検討** | 評価系との統合が必要 |

### 借用しない概念とその理由

```
❌ ベクトル埋め込み + コサイン類似度検索
   理由: sentence-transformers への依存が重い。
         Bun/TypeScript 環境では ONNX Runtime 等が必要になり複雑。
         代替: タグベースの検索 + LLM による関連性判定で十分。
         将来的に必要なら別パッケージとして追加可能。

❌ Hopfield ネットワーク連想想起
   理由: NumPy 行列演算への依存。ファイルベースでは不自然。
         代替: associations.json のグラフ走査（BFS/DFS）で連想を実現。
         グラフのリンク重みはシーン共起やLLM判定で更新。

❌ MCP サーバー形式
   理由: Applicot はスタンドアロンの CLI ツール。
         recall はライブラリとして直接呼び出す。
```

---

## ディレクトリ理想状態

フェーズ0.5完了時点。`★` はこのフェーズで新規追加。

### src/ (applicot リポジトリ)

```
src/
├── core/
│   ├── types/
│   │   ├── (フェーズ0の既存型定義)
│   │   └── recall.ts                 # 更新: memory-mcp 概念を反映した型再定義
│   ├── store/                         # (フェーズ0から変更なし)
│   └── visibility/                    # (フェーズ0から変更なし)
├── recall/                            ★ 新規ディレクトリ
│   ├── store.ts                       ★ RecallStore — ファイルI/O CRUD
│   ├── memory-entry.ts                ★ メモリエントリの読み書き
│   ├── associations.ts                ★ 連想リンク管理（グラフ操作）
│   ├── episodes.ts                    ★ エピソード管理（シーン単位グルーピング）
│   ├── consolidation.ts              ★ 記憶統合（LLM 要約による層間移動）
│   ├── search.ts                      ★ ランタイムインデックス + 検索
│   └── source-guard.ts               ★ 情報源制限ラッパー（可視性エンジン連携）
├── llm/                               # (フェーズ0から変更なし)
├── prompts/
│   ├── (フェーズ0の既存テンプレート)
│   └── templates/
│       └── recall-consolidate.ts      ★ 記憶要約テンプレート
└── cli/
    └── scaffold.ts                    # 更新: recall ディレクトリ構造の生成追加
```

### novel/recall/ (物語リポジトリ)

```
novel/                                 # ← 別の Git リポジトリ
└── recall/
    └── {actor_id}/                    # アクターごとに完全分離
        ├── recent.json                ★ 直近の記憶（詳細）
        ├── midterm.json               ★ 中期記憶（要約）
        ├── longterm.json              ★ 長期記憶（キーワード+感情）
        ├── pinned.json                ★ 永続記憶（トラウマ、決定的出会い）
        ├── associations.json          ★ メモリ間リンク（重み付きグラフ）
        └── episodes.json              ★ シーン単位のメモリグルーピング
```

### tests/ (applicot リポジトリ)

```
tests/
├── (フェーズ0の既存テスト)
└── recall/                            ★ 新規ディレクトリ
    ├── store.test.ts                  ★ RecallStore CRUD テスト
    ├── memory-entry.test.ts           ★ エントリ読み書きテスト
    ├── associations.test.ts           ★ リンク作成・グラフ走査テスト
    ├── episodes.test.ts               ★ エピソード管理テスト
    ├── consolidation.test.ts          ★ 層間移動テスト
    ├── search.test.ts                 ★ 検索テスト
    └── source-guard.test.ts           ★ 情報源制限テスト
```

---

## 1. データモデル

### 1.1 メモリエントリ

memory-mcp の `memories` テーブルをファイルベースに変換。

```typescript
// src/core/types/recall.ts

import { z } from "zod";

export const MemoryEntrySchema = z.object({
  id: z.string(),                    // "mem_{ulid}" — 時系列ソート可能
  content: z.string(),               // 記憶の内容（自然言語テキスト）
  timestamp: z.string().datetime(),  // ISO 8601
  scene: z.string(),                 // "cycle_1/scene_3" — 記憶が生成されたシーン
  source: z.object({                 // 情報源（可視性チェック用）
    dataId: z.string(),              // "HO-PUB" | "OUT-SCN" | "ST-CHR" | etc.
    ref: z.string().optional(),      // 具体的な参照先
  }),
  emotion: z.string().optional(),    // "suspicion" | "joy" | "fear" | etc.
  importance: z.number().min(1).max(10).default(5),
  tags: z.array(z.string()),         // 検索用キーワード
  accessCount: z.number().default(0),  // 参照された回数
  linkedTo: z.array(z.string()).default([]),  // 関連メモリID（associations の簡易参照）
});

export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
```

### 1.2 層構造

| 層 | ファイル | 内容 | 最大件数目安 | 劣化 |
|---|---|---|---|---|
| **recent** | `recent.json` | 詳細な記憶。content がフルテキスト | 20-30件 | midterm へ要約移動 |
| **midterm** | `midterm.json` | LLM による要約。content が要約文 | 50-100件 | longterm へ圧縮移動 |
| **longterm** | `longterm.json` | キーワード + 感情タグのみ。content が1行 | 制限なし | 劣化しない |
| **pinned** | `pinned.json` | 永続記憶。content がフルテキスト。劣化しない | 制限なし | 劣化しない |

各ファイルは `MemoryEntry[]` の JSON 配列。

```
git diff の見え方:

recent.json:
  - 新しいシーンの記憶が末尾に追加される → 差分は "+数行"
  - 古い記憶が midterm に移動 → 差分は "-数行"

midterm.json:
  - recent から要約されたエントリが追加 → "+数行"
  - 要約文なのでフルテキストより短い

associations.json:
  - 新しいリンクが追加 → "+1行"
  - 重みが変化 → "weight: 0.3 → 0.5" のように差分が出る
```

### 1.3 連想リンク（associations）

memory-mcp の `coactivation` テーブル + `linked_ids` をファイルベースに。

```typescript
// associations.json の構造
export const AssociationGraphSchema = z.object({
  links: z.array(z.object({
    source: z.string(),           // メモリID
    target: z.string(),           // メモリID
    type: z.enum([
      "same_scene",               // 同じシーンで生成された
      "causal",                   // 因果関係（source が target を引き起こした）
      "thematic",                 // テーマ的関連（LLM判定）
      "emotional",                // 感情的関連（同じ感情タグ）
      "entity",                   // 同じエンティティ（人物/場所/物）に言及
    ]),
    weight: z.number().min(0).max(1).default(0.5),
    createdAt: z.string().datetime(),
  })),
});
```

### 1.4 エピソード

memory-mcp の `episodes` テーブルをシーン単位に対応付け。

```typescript
// episodes.json の構造
export const EpisodeListSchema = z.object({
  episodes: z.array(z.object({
    id: z.string(),                // "ep_{scene_ref}" e.g. "ep_cycle_1_scene_3"
    scene: z.string(),             // "cycle_1/scene_3"
    memoryIds: z.array(z.string()), // このシーンで生成された全メモリのID
    summary: z.string().optional(), // エピソードの要約（consolidation で生成）
    emotion: z.string().optional(), // 支配的な感情
    importance: z.number(),         // 最も重要な記憶の importance
  })),
});
```

---

## 2. RecallStore

```typescript
// src/recall/store.ts

interface RecallStoreConfig {
  recallDir: string;  // 物語リポジトリ内の recall/ への絶対パス
}

class RecallStore {
  // --- 読み取り ---

  // 指定アクターの指定層からメモリを取得
  async getMemories(actorId: string, layer: MemoryLayer): Promise<MemoryEntry[]>;

  // 全層を横断して検索（ランタイムインデックス使用）
  async search(actorId: string, query: SearchQuery): Promise<MemoryEntry[]>;

  // 連想リンクを辿って関連記憶を取得（BFS、深さ制限付き）
  async getAssociated(
    actorId: string,
    memoryId: string,
    maxDepth?: number,
  ): Promise<AssociatedMemory[]>;

  // 指定シーンのエピソードに含まれる記憶を取得
  async getEpisodeMemories(actorId: string, scene: string): Promise<MemoryEntry[]>;

  // --- 書き込み ---

  // 新しい記憶を recent に追加
  async remember(actorId: string, entry: MemoryEntry): Promise<void>;

  // 連想リンクを追加/更新
  async link(actorId: string, source: string, target: string, type: LinkType): Promise<void>;

  // エピソードにメモリを追加
  async addToEpisode(actorId: string, scene: string, memoryId: string): Promise<void>;

  // --- 統合 ---

  // 記憶の統合（recent → midterm → longterm の移動）
  async consolidate(actorId: string, llm: LLMAdapter): Promise<ConsolidationResult>;

  // 記憶を pinned に昇格
  async pin(actorId: string, memoryId: string): Promise<void>;
}
```

### 検索の実装

```typescript
// src/recall/search.ts

interface SearchQuery {
  tags?: string[];           // タグによるフィルタ
  emotion?: string;          // 感情によるフィルタ
  scene?: string;            // シーンによるフィルタ
  minImportance?: number;    // 重要度の下限
  text?: string;             // テキスト部分一致（簡易）
  limit?: number;            // 最大件数
}

// ランタイムインデックス: 初回アクセス時にファイルから構築、以降キャッシュ
class RecallIndex {
  private tagIndex: Map<string, Set<string>>;       // tag → memoryId[]
  private emotionIndex: Map<string, Set<string>>;   // emotion → memoryId[]
  private sceneIndex: Map<string, Set<string>>;     // scene → memoryId[]

  // ファイルから再構築
  async rebuild(actorId: string): Promise<void>;

  // 検索実行
  search(query: SearchQuery): string[]; // → memoryId[]
}
```

ベクトル検索を使わない代わりに、より精度が必要な場面では LLM に
「この記憶群の中から、以下のコンテキストに関連するものを選べ」と問い合わせる。

---

## 3. 記憶統合（Consolidation）

memory-mcp の sleep consolidation をファイルシステム版に。

### 統合トリガー

```
1. シーン完了時: 直前シーンの記憶を recent に書き込み後に実行
2. サイクル完了時: 全層の大掃除
3. 手動トリガー: CLI から実行可能
```

### 統合フロー

```
recent.json （30件を超過した場合）
    ↓
  古いエントリを選択（importance が低い + accessCount が少ない）
    ↓
  LLM (Haiku) で要約:
    入力: 選択されたエントリ群
    出力: 要約テキスト + 残すべきタグ + 感情タグ
    ↓
  要約結果を midterm.json に追加
  元のエントリを recent.json から削除
    ↓
  importance >= 8 のエントリ → pinned.json に複製
    ↓
  associations.json 更新:
    - 同一シーンの記憶間にリンクを自動追加 (type: "same_scene")
    - 同じタグを持つ記憶間にリンクを自動追加 (type: "entity", weight: 0.3)
    - 既存リンクの weight を更新（共起頻度に基づく）

midterm.json （100件を超過した場合）
    ↓
  古いエントリを選択
    ↓
  キーワード + 感情タグに圧縮（LLM不要、機械的処理）
    ↓
  longterm.json に追加
  元のエントリを midterm.json から削除
```

### 統合の git diff 表現

```diff
# recall/chr_a/recent.json
- { "id": "mem_01HX...", "content": "城壁の前で CHR-B が...", ... }
+ (削除 — midterm へ移動)

# recall/chr_a/midterm.json
+ { "id": "mem_01HX...", "content": "【要約】CHR-B の不審な行動を目撃", ... }

# recall/chr_a/associations.json
+ { "source": "mem_01HX...", "target": "mem_01HY...", "type": "same_scene", "weight": 0.5 }
```

---

## 4. 情報源制限

可視性エンジンと連携して、不正な情報源からの記憶形成を防止する。

```typescript
// src/recall/source-guard.ts

class RecallSourceGuard {
  constructor(
    private visibility: VisibilityEngine,
    private store: RecallStore,
  ) {}

  // 記憶の書き込み前に情報源を検証
  async guardedRemember(
    actorId: string,
    entry: MemoryEntry,
  ): Promise<void> {
    // 1. このアクターがこの情報源にアクセスできるか検証
    const canAccess = this.visibility.canAccess(actorId, entry.source.dataId);
    if (!canAccess) {
      throw new RecallSourceViolationError(
        `${actorId} cannot form memory from ${entry.source.dataId}`
      );
    }

    // 2. OK → store に書き込み
    await this.store.remember(actorId, entry);
  }
}
```

```
情報源チェックの例:

CHR-A が記憶を形成しようとする場合:
  ✅ source: { dataId: "HO-PUB" }       — 公開ハンドアウトは参照可能
  ✅ source: { dataId: "HO-PRV-chr_a" } — 自分の非公開ハンドアウト
  ✅ source: { dataId: "OUT-SCN", ref: "cycle_1/scene_3" }
                                         — 自分が登場したシーン
  ❌ source: { dataId: "HO-PRV-chr_b" } — 他者の非公開ハンドアウト
  ❌ source: { dataId: "HO-GM" }         — GMハンドアウト
  ❌ source: { dataId: "TRK-FSH" }       — 伏線台帳
```

---

## 5. プロンプト組み立てとの統合

フェーズ1以降でアクターのプロンプトを組み立てる際、recall データを注入する。

```typescript
// recall からプロンプト用のコンテキストを構築
async function buildRecallContext(
  actorId: string,
  currentScene: string,
  store: RecallStore,
): Promise<string> {
  // 1. recent の全エントリ（詳細）
  const recent = await store.getMemories(actorId, "recent");

  // 2. pinned の全エントリ（永続記憶）
  const pinned = await store.getMemories(actorId, "pinned");

  // 3. 現在のシーンに関連する midterm エントリ（タグ検索）
  const relevant = await store.search(actorId, {
    tags: extractSceneTags(currentScene),
    limit: 10,
  });

  // 4. テンプレートに組み込み
  return formatRecallForPrompt(recent, pinned, relevant);
}
```

---

## 6. ファイルの JSON 直列化規約

git diff の品質を保証するために、JSON の書き出しルールを統一する。

```typescript
// 全 recall ファイルに適用する直列化関数
function serializeForGit(data: unknown): string {
  return JSON.stringify(data, null, 2) + "\n";
  // - indent: 2 スペース（diff の可読性）
  // - キー順序: zod のスキーマ定義順（parse → serialize で安定）
  // - 末尾改行: git の "No newline at end of file" 警告を防止
}
```

メモリエントリの配列は `id` の辞書順でソートして保存する。
これにより、同じデータは常に同じバイト列になり、無意味な diff を防ぐ。
