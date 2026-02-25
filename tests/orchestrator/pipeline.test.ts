import { describe, test, expect, mock, afterEach } from "bun:test";

// runActorSession をモックする
// EDT design → CHR action → AUT write → EDT review の流れをテスト

// mock.module はテストファイルのトップレベルで呼ぶ必要がある
mock.module("../../src/runner/actor.js", () => ({
  runActorSession: async (_input: { actorId: string; prompt: string; novelDir: string }) => {
    return { content: "{}" };
  },
}));

import { executeScenePipeline } from "../../src/orchestrator/pipeline.js";
import type { CycleContext } from "../../src/orchestrator/types.js";

const TEST_NOVEL_DIR = "/tmp/applicot-test-novel-" + Date.now();

function makeCtx(overrides: Partial<CycleContext> = {}): CycleContext {
  return {
    novelDir: TEST_NOVEL_DIR,
    cycleNumber: 1,
    totalScenes: 4,
    completedScenes: 0,
    enableEvaluation: false,
    ...overrides,
  };
}

describe("executeScenePipeline", () => {
  test("EDT design が JSON を返すと ScenePrompt が生成される", async () => {
    let edtCallCount = 0;
    mock.module("../../src/runner/actor.js", () => ({
      runActorSession: async (input: { actorId: string; prompt: string; novelDir: string }) => {
        if (input.actorId === "EDT") {
          edtCallCount++;
          if (edtCallCount === 1) {
            return { content: JSON.stringify({ directorNote: "テスト演出", activatedActors: ["CHR-alice"], dramaticTension: "緊張感テスト" }) };
          }
          return { content: JSON.stringify({ verdict: "approved" }) };
        }
        if (input.actorId === "CHR-alice") {
          return { content: JSON.stringify({ actionType: "dialogue", content: "テストセリフ", internalReason: "テスト理由", citations: [] }) };
        }
        return { content: "# scene" };
      },
    }));

    const result = await executeScenePipeline(1, makeCtx());

    expect(result.scenePrompt.directorNote).toBe("テスト演出");
    expect(result.scenePrompt.activatedActors).toContain("CHR-alice");
    expect(result.actionProposals).toHaveLength(1);
    expect(result.actionProposals[0].actorId).toBe("CHR-alice");
    expect(result.manuscript.sceneNumber).toBe(1);
    expect(result.review.verdict).toBe("approved");
  });

  test("EDT review が revise を返すと修正ループが走り revisionCount が増える", async () => {
    let edtCallCount = 0;
    mock.module("../../src/runner/actor.js", () => ({
      runActorSession: async (input: { actorId: string; prompt: string; novelDir: string }) => {
        if (input.actorId === "EDT") {
          edtCallCount++;
          if (edtCallCount === 1) {
            return { content: JSON.stringify({ directorNote: "レビューテスト", activatedActors: [], dramaticTension: "緊張" }) };
          } else if (edtCallCount === 2) {
            return { content: JSON.stringify({ verdict: "revise", comments: "もっと緊張感を" }) };
          }
          return { content: JSON.stringify({ verdict: "approved" }) };
        }
        return { content: "# scene" };
      },
    }));

    const result = await executeScenePipeline(1, makeCtx());
    expect(result.revisionCount).toBeGreaterThanOrEqual(1);
    expect(result.review.verdict).toBe("approved");
  });

  test("enableEvaluation: true で evaluationResult が返る", async () => {
    const rdrReport = {
      quadrant: "expected-positive",
      score: 0.8,
      keyMoments: ["感動シーン"],
      concerns: [],
      summary: "良いシーンでした",
    };
    mock.module("../../src/runner/actor.js", () => ({
      runActorSession: async (input: { actorId: string; prompt: string; novelDir: string }) => {
        if (input.actorId === "EDT") {
          return { content: JSON.stringify({ directorNote: "評価テスト", activatedActors: [], dramaticTension: "緊張" }) };
        }
        if (typeof input.actorId === "string" && input.actorId.startsWith("RDR-")) {
          return { content: JSON.stringify(rdrReport) };
        }
        return { content: "# scene" };
      },
    }));

    const result = await executeScenePipeline(1, makeCtx({ enableEvaluation: true }));
    expect(result.evaluationResult).toBeDefined();
    expect(result.evaluationResult!.reports).toHaveLength(4);
    expect(result.evaluationResult!.evlReport).toContain("EVL-RPT");
  });
});
