import { describe, expect, test } from "bun:test";
import { buildEnvReportPrompt } from "../../src/prompts/templates/env-report.js";

describe("buildEnvReportPrompt", () => {
  const baseCtx = {
    sceneNumber: 2,
    cycleNumber: 1,
    environmentState: JSON.stringify({
      weather: { current: "快晴" },
      season: "初夏",
      timeOfDay: "夕暮れ",
      geography: { terrain: "草原", notableFeatures: ["丘陵地帯"] },
      ecology: { flora: ["ススキ"], fauna: ["ウサギ"], anomalies: [] },
      deepPatterns: { climateTrend: "徐々に乾燥化", tectonicActivity: undefined },
    }),
    publicHandout: "## 世界設定\n広大な草原に包まれた王国。",
    recentMemory: "",
    directorNote: "夕暮れの草原でキャラクターAとBが出会う",
  };

  test("builds a prompt with JSON output instruction", () => {
    const prompt = buildEnvReportPrompt(baseCtx);
    expect(prompt).toContain("ENV");
    expect(prompt).toContain("observable");
    expect(prompt).toContain("nonObservable");
    expect(prompt).toContain("envNote");
    expect(prompt).toContain("json");
  });

  test("includes environment state in prompt", () => {
    const prompt = buildEnvReportPrompt(baseCtx);
    expect(prompt).toContain("快晴");
  });

  test("includes director note in prompt", () => {
    const prompt = buildEnvReportPrompt(baseCtx);
    expect(prompt).toContain("夕暮れの草原でキャラクターAとBが出会う");
  });

  test("handles empty recentMemory gracefully", () => {
    const prompt = buildEnvReportPrompt({ ...baseCtx, recentMemory: "" });
    expect(prompt).toContain("まだ記憶なし");
  });

  test("handles empty publicHandout gracefully", () => {
    const prompt = buildEnvReportPrompt({ ...baseCtx, publicHandout: "" });
    expect(prompt).toContain("世界情報なし");
  });
});
