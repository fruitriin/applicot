import { describe, expect, test } from "bun:test";
import { buildOrgReportPrompt } from "../../src/prompts/templates/org-report.js";

describe("buildOrgReportPrompt", () => {
  const baseCtx = {
    actorId: "ORG-guild",
    orgId: "guild",
    sceneNumber: 2,
    cycleNumber: 1,
    orgState: JSON.stringify({
      id: "guild",
      name: "盗賊ギルド",
      type: "criminal",
      public: { description: "旅人の互助組合を名乗る", publicGoals: ["旅行者支援"], knownMembers: ["アリス"] },
      internal: { resources: { gold: 1000 }, internalPolicies: ["沈黙の掟"], factions: [{ id: "inner", name: "内輪", influence: 80, goals: ["権力維持"], members: ["ボブ"] }] },
      secret: { hiddenAgenda: "王城への侵入計画", secretAlliances: ["暗殺者協会"], secretResources: { poison: 20 } },
    }),
    publicHandout: "## 世界設定\n中世風の王国。",
    nationState: "",
    recentMemory: "",
    directorNote: "ギルドの内部会議シーン",
    activeFactions: ["inner"],
  };

  test("builds a prompt with JSON output instruction", () => {
    const prompt = buildOrgReportPrompt(baseCtx);
    expect(prompt).toContain("ORG-guild");
    expect(prompt).toContain("summary");
    expect(prompt).toContain("factionDynamics");
    expect(prompt).toContain("orgNote");
  });

  test("includes org state in prompt", () => {
    const prompt = buildOrgReportPrompt(baseCtx);
    expect(prompt).toContain("盗賊ギルド");
  });

  test("includes active factions", () => {
    const prompt = buildOrgReportPrompt(baseCtx);
    expect(prompt).toContain("inner");
  });

  test("handles empty recentMemory", () => {
    const prompt = buildOrgReportPrompt({ ...baseCtx, recentMemory: "" });
    expect(prompt).toContain("まだ記憶なし");
  });
});
