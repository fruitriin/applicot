import { describe, expect, it } from "bun:test";
import type { ActorId } from "../../src/core/types/ids.js";
import {
  cascadeLayerOf,
  buildActivationListFromSet,
  executeCascade,
} from "../../src/orchestrator/cascade.js";
import type { CascadeTrigger } from "../../src/orchestrator/cascade.js";

// ── cascadeLayerOf ──

describe("cascadeLayerOf", () => {
  it("ENV → 0", () => {
    expect(cascadeLayerOf("ENV")).toBe(0);
  });

  it("NAT-A → 1", () => {
    expect(cascadeLayerOf("NAT-A")).toBe(1);
  });

  it("ORG-X1 → 2", () => {
    expect(cascadeLayerOf("ORG-X1")).toBe(2);
  });

  it("CHR-HERO → 3", () => {
    expect(cascadeLayerOf("CHR-HERO")).toBe(3);
  });
});

// ── buildActivationListFromSet ──

describe("buildActivationListFromSet", () => {
  it("empty set → all fields empty/false", () => {
    const result = buildActivationListFromSet(new Set<ActorId>());
    expect(result.characters).toEqual([]);
    expect(result.organizations).toEqual([]);
    expect(result.nations).toEqual([]);
    expect(result.env).toBe(false);
  });

  it("ENV only → env:true, others empty", () => {
    const result = buildActivationListFromSet(new Set(["ENV" as ActorId]));
    expect(result.env).toBe(true);
    expect(result.characters).toEqual([]);
    expect(result.organizations).toEqual([]);
    expect(result.nations).toEqual([]);
  });

  it("mixed set (ENV + NAT-a + ORG-b + CHR-c) → all fields classified correctly", () => {
    const ids = new Set(["ENV", "NAT-a", "ORG-b", "CHR-c"] as ActorId[]);
    const result = buildActivationListFromSet(ids);
    expect(result.env).toBe(true);
    expect(result.nations).toEqual(["NAT-a"]);
    expect(result.organizations).toEqual(["ORG-b"]);
    expect(result.characters).toEqual(["CHR-c"]);
  });
});

// ── executeCascade ──

const makeTrigger = (sourceActorId: ActorId): CascadeTrigger => ({
  sourceActorId,
  eventDescription: "大規模地震",
  severity: "critical",
});

describe("executeCascade — depth 制限", () => {
  it("maxDepth=0 → source のみ（assessImpact の結果は含まれない）", async () => {
    const assessed: ActorId[] = [];
    const assessImpact = async (actorId: ActorId) => {
      assessed.push(actorId);
      return ["NAT-a"] as ActorId[];
    };
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact, 0);
    expect(assessed).toHaveLength(0);
    expect(result.env).toBe(true);
    expect(result.nations).toEqual([]);
    expect(result.characters).toEqual([]);
    expect(result.organizations).toEqual([]);
  });

  it("maxDepth=1 → source + 1段階のみ", async () => {
    const assessImpact = async (actorId: ActorId) => {
      if (actorId === "ENV") return ["NAT-a", "NAT-b"] as ActorId[];
      return ["ORG-x"] as ActorId[];
    };
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact, 1);
    expect(result.env).toBe(true);
    expect(result.nations).toEqual(["NAT-a", "NAT-b"]);
    expect(result.organizations).toEqual([]);
    expect(result.characters).toEqual([]);
  });

  it("maxDepth=3（デフォルト）→ ENV→NAT→ORG→CHR の4段階が全て含まれる", async () => {
    const assessImpact = async (actorId: ActorId) => {
      if (actorId === "ENV") return ["NAT-a"] as ActorId[];
      if (actorId === "NAT-a") return ["ORG-a1"] as ActorId[];
      if (actorId === "ORG-a1") return ["CHR-x"] as ActorId[];
      return [];
    };
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact);
    expect(result.env).toBe(true);
    expect(result.nations).toContain("NAT-a");
    expect(result.organizations).toContain("ORG-a1");
    expect(result.characters).toContain("CHR-x");
  });

  it("source が NAT-* の場合 → NAT→ORG→CHR の3段階", async () => {
    const assessImpact = async (actorId: ActorId) => {
      if (actorId === "NAT-a") return ["ORG-a1"] as ActorId[];
      if (actorId === "ORG-a1") return ["CHR-x"] as ActorId[];
      return [];
    };
    const result = await executeCascade(makeTrigger("NAT-a" as ActorId), assessImpact);
    expect(result.env).toBe(false);
    expect(result.nations).toContain("NAT-a");
    expect(result.organizations).toContain("ORG-a1");
    expect(result.characters).toContain("CHR-x");
  });
});

describe("executeCascade — 重複排除", () => {
  it("複数の親が同じ子 actor を返す場合 → 1回しか含まれない", async () => {
    const assessImpact = async (actorId: ActorId) => {
      if (actorId === "ENV") return ["NAT-a", "NAT-b"] as ActorId[];
      if (actorId === "NAT-a") return ["ORG-shared"] as ActorId[];
      if (actorId === "NAT-b") return ["ORG-shared"] as ActorId[];
      return [];
    };
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact);
    expect(result.organizations.filter((id) => id === "ORG-shared")).toHaveLength(1);
  });

  it("assessImpact が source と同じ ID を返す場合 → ループせず終了", async () => {
    let callCount = 0;
    const assessImpact = async (_actorId: ActorId) => {
      callCount++;
      return ["ENV"] as ActorId[];
    };
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact, 3);
    // ENV は既に activated なので nextQueue に追加されない → callCount は1のみ
    expect(callCount).toBe(1);
    expect(result.env).toBe(true);
  });
});

describe("executeCascade — 空/最小", () => {
  it("assessImpact が常に空を返す → source のみ", async () => {
    const assessImpact = async (_actorId: ActorId) => [] as ActorId[];
    const result = await executeCascade(makeTrigger("ENV" as ActorId), assessImpact);
    expect(result.env).toBe(true);
    expect(result.nations).toEqual([]);
    expect(result.organizations).toEqual([]);
    expect(result.characters).toEqual([]);
  });

  it("trigger.sourceActorId が CHR-* → assessImpact が返す actor も含まれる（層は関係ない、純粋BFS）", async () => {
    const assessImpact = async (actorId: ActorId) => {
      if (actorId === "CHR-hero") return ["ORG-guild", "NAT-kingdom"] as ActorId[];
      return [];
    };
    const result = await executeCascade(makeTrigger("CHR-hero" as ActorId), assessImpact);
    expect(result.characters).toContain("CHR-hero");
    expect(result.organizations).toContain("ORG-guild");
    expect(result.nations).toContain("NAT-kingdom");
  });
});
