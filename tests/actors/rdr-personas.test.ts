import { describe, it, expect } from "bun:test";
import { buildRdrAnalyticalPrompt } from "../../src/prompts/templates/rdr-ana.js";
import { buildRdrEmotionalPrompt } from "../../src/prompts/templates/rdr-emo.js";
import { buildRdrCriticalPrompt } from "../../src/prompts/templates/rdr-crt.js";
import { buildRdrNaivePrompt } from "../../src/prompts/templates/rdr-nav.js";

const SAMPLE_MANUSCRIPT = "# シーン1\n\n太郎は剣を握りしめた。「覚惟しろ」と彼は言った。";
const BASE_CTX = { manuscriptContent: SAMPLE_MANUSCRIPT, sceneNumber: 1, cycleNumber: 1 };

describe("RDR-ANA プロンプト", () => {
  it("原稿テキストを含む", () => {
    const prompt = buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...BASE_CTX });
    expect(prompt).toContain(SAMPLE_MANUSCRIPT);
  });
  it("ハンドアウト・状態データへの参照を含まない", () => {
    const prompt = buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...BASE_CTX });
    expect(prompt).not.toContain("handout");
    expect(prompt).not.toContain("state/");
  });
  it("JSON出力形式を要求する", () => {
    const prompt = buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...BASE_CTX });
    expect(prompt).toContain("quadrant");
    expect(prompt).toContain("score");
    expect(prompt).toContain("keyMoments");
    expect(prompt).toContain("summary");
  });
  it("分析的読者の特性を示す指示を含む", () => {
    const prompt = buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...BASE_CTX });
    expect(prompt).toContain("伏線");
  });
});

describe("RDR-EMO プロンプト", () => {
  it("原稿テキストを含む", () => {
    const prompt = buildRdrEmotionalPrompt({ actorId: "RDR-EMO", ...BASE_CTX });
    expect(prompt).toContain(SAMPLE_MANUSCRIPT);
  });
  it("感情的読者の特性を示す指示を含む", () => {
    const prompt = buildRdrEmotionalPrompt({ actorId: "RDR-EMO", ...BASE_CTX });
    expect(prompt).toMatch(/感情|共感|没入/);
  });
});

describe("RDR-CRT プロンプト", () => {
  it("原稿テキストを含む", () => {
    const prompt = buildRdrCriticalPrompt({ actorId: "RDR-CRT", ...BASE_CTX });
    expect(prompt).toContain(SAMPLE_MANUSCRIPT);
  });
  it("批評的読者の特性を示す指示を含む", () => {
    const prompt = buildRdrCriticalPrompt({ actorId: "RDR-CRT", ...BASE_CTX });
    expect(prompt).toMatch(/文体|テーマ|批評|表現/);
  });
});

describe("RDR-NAV プロンプト", () => {
  it("原稿テキストを含む", () => {
    const prompt = buildRdrNaivePrompt({ actorId: "RDR-NAV", ...BASE_CTX });
    expect(prompt).toContain(SAMPLE_MANUSCRIPT);
  });
  it("素朴な読者の特性を示す指示を含む", () => {
    const prompt = buildRdrNaivePrompt({ actorId: "RDR-NAV", ...BASE_CTX });
    expect(prompt).toMatch(/面白|退屈|次が読/);
  });
});

describe("RDR ペルソナ独立性", () => {
  it("4つのプロンプトはすべて異なる", () => {
    const ana = buildRdrAnalyticalPrompt({ actorId: "RDR-ANA", ...BASE_CTX });
    const emo = buildRdrEmotionalPrompt({ actorId: "RDR-EMO", ...BASE_CTX });
    const crt = buildRdrCriticalPrompt({ actorId: "RDR-CRT", ...BASE_CTX });
    const nav = buildRdrNaivePrompt({ actorId: "RDR-NAV", ...BASE_CTX });
    expect(ana).not.toBe(emo);
    expect(emo).not.toBe(crt);
    expect(crt).not.toBe(nav);
  });
});
