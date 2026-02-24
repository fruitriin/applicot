import { describe, expect, test } from "bun:test";
import { buildNatReportPrompt } from "../../src/prompts/templates/nat-report.js";

describe("buildNatReportPrompt", () => {
  const baseCtx = {
    actorId: "NAT-england",
    natId: "england",
    sceneNumber: 3,
    cycleNumber: 1,
    ownPublicLayer: JSON.stringify({ name: "イングランド王国", territory: "島国", officialPolicy: ["海洋覇権"], publicDeclarations: ["中立宣言"] }),
    ownRestrictedLayer: JSON.stringify({ militaryDeployment: "北部に3個師団", economicDetails: { tax: 40 }, ongoingNegotiations: ["フランスとの密約"] }),
    ownSecretLayer: JSON.stringify({ secretTreaties: ["暗殺者協会との協定"], royalSecrets: ["王位継承問題"], trueStrategicIntent: "大陸制圧" }),
    otherNationsPublic: "",
    subordinateOrgs: "",
    publicHandout: "## 世界設定\nヨーロッパ風大陸。",
    recentMemory: "",
    directorNote: "国境紛争が激化しているシーン",
  };

  test("builds a prompt with JSON output instruction", () => {
    const prompt = buildNatReportPrompt(baseCtx);
    expect(prompt).toContain("NAT-england");
    expect(prompt).toContain("policyUpdate");
    expect(prompt).toContain("militaryPosture");
    expect(prompt).toContain("natNote");
  });

  test("includes all three state layers", () => {
    const prompt = buildNatReportPrompt(baseCtx);
    expect(prompt).toContain("イングランド王国");
    expect(prompt).toContain("北部に3個師団");
    expect(prompt).toContain("大陸制圧");
  });

  test("includes director note", () => {
    const prompt = buildNatReportPrompt(baseCtx);
    expect(prompt).toContain("国境紛争が激化しているシーン");
  });

  test("handles empty fields gracefully", () => {
    const prompt = buildNatReportPrompt({ ...baseCtx, recentMemory: "" });
    expect(prompt).toContain("まだ記憶なし");
  });
});
