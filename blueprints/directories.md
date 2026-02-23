# ノベルプロジェクト ディレクトリ構造定義

実装元: `src/core/store/paths.ts`, `src/cli/scaffold.ts`, `src/mcp/context.ts`, `src/core/visibility/rules.ts`

## ディレクトリツリー

```
{novel-root}/
├── CLAUDE.md                          # システムルール、MCP使用方法、アクター一覧
├── .mcp.json                          # MCP サーバー接続設定
│
├── actors/                            # アクター定義
│   ├── EDT/SOUL.md                    #   常時生成
│   ├── AUT/SOUL.md                    #   常時生成
│   ├── ENV/SOUL.md                    #   常時生成
│   ├── CHR-{id}/SOUL.md              #   キャラクターごと
│   ├── NAT-{id}/SOUL.md              #   国家ごと
│   ├── ORG-{id}/SOUL.md              #   組織ごと
│   └── RDR-{persona}/SOUL.md         #   読者ペルソナごと (ANA/EMO/CRT/NAV)
│
├── handouts/                          # ハンドアウト（情報シート）
│   ├── public/                        #   全アクター参照可
│   │   └── {name}.md                  #     世界設定、公開情報
│   ├── private/                       #   対象アクター + EDT のみ
│   │   └── {id}.md                    #     キャラクター秘密、個別情報
│   └── gm/                            #   EDT のみ
│       └── {name}.md                  #     シナリオ、トリガー、エンディング
│
├── state/                             # 状態データ
│   ├── characters/                    #   キャラクター状態
│   │   └── {id}.json                  #     CharacterStateSchema 準拠
│   ├── organizations/                 #   組織状態
│   │   └── {id}.json                  #     OrganizationStateSchema 準拠
│   ├── nations/                       #   国家状態（3層）
│   │   └── {id}/
│   │       ├── public.json            #       公開層
│   │       ├── restricted.json        #       制限層
│   │       └── secret.json            #       秘密層
│   ├── environment.json               #   環境状態 (EnvironmentStateSchema)
│   ├── relationships.json             #   関係性グラフ { edges: [] }
│   ├── foreshadowing.json             #   伏線台帳 []
│   ├── tension_curve.json             #   緊張度曲線 []
│   └── timeline.json                  #   タイムライン []
│
├── scenes/                            # シーン出力（AUT が書き込み）
│   └── cycle_{N}/
│       └── scene_{M}.md
│
├── recall/                            # アクター記憶
│   └── {actor}/                       #   例: CHR-alice, EDT
│       ├── recent.json                #     最近の記憶
│       ├── midterm.json               #     中期記憶
│       ├── longterm.json              #     長期記憶
│       └── pinned.json                #     ピン留め記憶
│
├── campaign/                          # キャンペーン管理
│   ├── consequences.md                #   結果台帳
│   └── arcs/
│       └── {id}.md                    #   アーク進捗
│
├── evaluation/                        # 読者評価
│   ├── {type}.json                    #   四象限分類データ
│   └── report.md                      #   評価レポート
│
└── meta/                              # メタ情報
    ├── config.json                    #   プロジェクト設定
    └── session_log.md                 #   セッションログ
```

## DataId マッピング

| DataId パターン | ファイルパス | 形式 |
|---|---|---|
| `HO-PUB-{name}` | `handouts/public/{name}.md` | Markdown |
| `HO-PRV-{id}` | `handouts/private/{id}.md` | Markdown |
| `HO-GM-{name}` | `handouts/gm/{name}.md` | Markdown |
| `ST-CHR-{id}` | `state/characters/{id}.json` | JSON |
| `ST-ORG-{id}` | `state/organizations/{id}.json` | JSON |
| `ST-NAT-{id}-{layer}` | `state/nations/{id}/{layer}.json` | JSON |
| `ST-ENV` | `state/environment.json` | JSON |
| `ST-REL` | `state/relationships.json` | JSON |
| `TRK-FSH` | `state/foreshadowing.json` | JSON |
| `TRK-TEN` | `state/tension_curve.json` | JSON |
| `TRK-TML` | `state/timeline.json` | JSON |
| `TRK-CSQ` | `campaign/consequences.md` | Markdown |
| `TRK-ARC-{id}` | `campaign/arcs/{id}.md` | Markdown |
| `OUT-SCN-{cycle}-{scene}` | `scenes/cycle_{cycle}/scene_{scene}.md` | Markdown |
| `EVL-{type}` | `evaluation/{type}.json` | JSON |
| `EVL-RPT` | `evaluation/report.md` | Markdown |
| `RCL-{actor}-{layer}` | `recall/{actor}/{layer}.json` | JSON |
| `META-CFG` | `meta/config.json` | JSON |
| `META-LOG` | `meta/session_log.md` | Markdown |

ディレクトリ一覧用プレフィックス: `HO-PUB`, `HO-GM`, `ST-CHR`, `ST-ORG`, `RCL`

## 可視性マトリクス（読み取り）

| DataId | EDT | CHR-{id} | AUT | ENV | NAT-{id} | ORG-{id} | RDR-{p} |
|---|---|---|---|---|---|---|---|
| HO-PUB-* | R | R | R | R | R | R | - |
| HO-PRV-{id} | R | 自分のみ | - | - | - | - | - |
| HO-GM-* | R | - | - | - | - | - | - |
| ST-CHR-{id} | R | 自分のみ | - | - | - | - | - |
| ST-ORG-{id} | R | - | - | - | 配下のみ | 自分のみ | - |
| ST-NAT-{id}-* | R | - | - | - | 自分のみ | 所属国公開層 | - |
| ST-ENV | R | - | - | R | R | - | - |
| ST-REL | R | 自分関連 | - | - | - | - | - |
| TRK-FSH | R | - | - | - | - | - | - |
| TRK-TEN | R | - | - | - | - | - | - |
| TRK-TML | R | - | - | R(公開) | R(公開) | R(自組織) | - |
| OUT-SCN-* | R | - | 過去のみ | - | - | - | R(順次) |
| EVL-* | R | - | - | - | - | - | 自分のみ |
| RCL-{actor}-* | R | 自分のみ | - | - | - | - | 自分のみ |

R = 読み取り可, - = アクセス不可

## 書き込み権限マトリクス

| アクター | 書き込み可能 DataId |
|---|---|
| EDT | 全データ |
| CHR-{id} | `RCL-CHR-{id}-*` (自分の記憶のみ) |
| AUT | `OUT-SCN-*` (シーン出力) |
| ENV | `ST-ENV` |
| NAT-{id} | `ST-NAT-{id}-*` |
| ORG-{id} | `ST-ORG-{id}` |
| RDR-{p} | `EVL-*` |

## スキャフォールド生成ファイル

scaffold が自動生成する初期データファイル:

| ファイル | 初期値 |
|---|---|
| `state/environment.json` | `{}` |
| `state/relationships.json` | `{ "edges": [] }` |
| `state/foreshadowing.json` | `[]` |
| `state/tension_curve.json` | `[]` |
| `state/timeline.json` | `[]` |
| `meta/config.json` | `{ genre, scale, title, createdAt }` |
| `campaign/consequences.md` | 見出しのみ |
| `meta/session_log.md` | 見出しのみ |
| `CLAUDE.md` | テンプレート生成 |
| `.mcp.json` | テンプレート生成 |
| `actors/*/SOUL.md` | テンプレート生成 |

**ユーザーが作成する必要があるファイル:**

| ファイル | 内容 |
|---|---|
| `handouts/public/*.md` | 世界設定、公開情報 |
| `handouts/private/{id}.md` | キャラクターの秘密、個別設定 |
| `handouts/gm/*.md` | シナリオ、トリガー条件、エンディング分岐 |
| `state/characters/{id}.json` | キャラクター初期状態 |
| `state/organizations/{id}.json` | 組織初期状態（使用時） |
| `state/nations/{id}/*.json` | 国家初期状態（使用時） |
