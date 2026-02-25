import { describe, expect, it, test } from "bun:test";
import { buildNatReportPrompt } from "../../src/prompts/templates/nat-report.js";
import type { NatReportContext } from "../../src/prompts/templates/nat-report.js";

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

describe('buildNatReportPrompt - wartime', () => {
  it('includes wartime section when isWartime is true', () => {
    const ctx: NatReportContext = {
      actorId: 'NAT-england',
      natId: 'england',
      sceneNumber: 5,
      cycleNumber: 1,
      ownPublicLayer: 'England public',
      ownRestrictedLayer: 'England restricted',
      ownSecretLayer: 'England secret',
      otherNationsPublic: 'France: at war',
      subordinateOrgs: '',
      publicHandout: 'World at war',
      recentMemory: '',
      directorNote: 'Critical battle scene',
      isWartime: true,
      warStatus: '交戦国: フランス。北部戦線で膠着状態。',
    };
    const prompt = buildNatReportPrompt(ctx);
    expect(prompt).toContain('⚔️ 戦時状態');
    expect(prompt).toContain('交戦国: フランス');
    expect(prompt).toContain('戦時特殊指示');
    expect(prompt).toContain('wartimeActions');
    expect(prompt).toContain('毎シーン更新');
  });

  it('omits wartime section when isWartime is false', () => {
    const ctx: NatReportContext = {
      actorId: 'NAT-england',
      natId: 'england',
      sceneNumber: 1,
      cycleNumber: 1,
      ownPublicLayer: '',
      ownRestrictedLayer: '',
      ownSecretLayer: '',
      otherNationsPublic: '',
      subordinateOrgs: '',
      publicHandout: '',
      recentMemory: '',
      directorNote: 'Peaceful scene',
      isWartime: false,
    };
    const prompt = buildNatReportPrompt(ctx);
    expect(prompt).not.toContain('⚔️ 戦時状態');
    expect(prompt).not.toContain('戦時特殊指示');
  });

  it('omits wartime section when isWartime is undefined', () => {
    const ctx: NatReportContext = {
      actorId: 'NAT-england',
      natId: 'england',
      sceneNumber: 1,
      cycleNumber: 1,
      ownPublicLayer: '',
      ownRestrictedLayer: '',
      ownSecretLayer: '',
      otherNationsPublic: '',
      subordinateOrgs: '',
      publicHandout: '',
      recentMemory: '',
      directorNote: 'Peaceful scene',
    };
    const prompt = buildNatReportPrompt(ctx);
    expect(prompt).not.toContain('⚔️ 戦時状態');
  });
});
