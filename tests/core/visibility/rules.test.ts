import { describe, test, expect } from "bun:test";
import { ABSOLUTE_BARRIERS, CREATIVE_ACTOR_TYPES } from "../../../src/core/visibility/rules.js";

describe("ABSOLUTE_BARRIERS", () => {
  test("all rules are level 1", () => {
    for (const rule of ABSOLUTE_BARRIERS) {
      expect(rule.level).toBe("1");
    }
  });

  test("all rules have descriptions", () => {
    for (const rule of ABSOLUTE_BARRIERS) {
      expect(rule.description).toBeTruthy();
    }
  });

  test("has rule for CHR private handout cross-access", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "CHR-*" && r.data === "HO-PRV-*" && r.condition === "not_own",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for CHR GM handout", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "CHR-*" && r.data === "HO-GM" && r.condition === "always",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for AUT private handout", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "AUT" && r.data === "HO-PRV-*" && r.condition === "always",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for AUT GM handout", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "AUT" && r.data === "HO-GM" && r.condition === "always",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for RDR all handouts", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "RDR-*" && r.data === "HO-*" && r.condition === "always",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for creative actors evaluation", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "creative_actors" && r.data === "EVL-*",
    );
    expect(rule).toBeDefined();
  });

  test("has rule for RDR cross-evaluation", () => {
    const rule = ABSOLUTE_BARRIERS.find(
      (r) => r.actor === "RDR-*" && r.data === "RDR-*" && r.condition === "not_own",
    );
    expect(rule).toBeDefined();
  });
});

describe("CREATIVE_ACTOR_TYPES", () => {
  test("includes all creative types", () => {
    expect(CREATIVE_ACTOR_TYPES).toContain("ENV");
    expect(CREATIVE_ACTOR_TYPES).toContain("NAT");
    expect(CREATIVE_ACTOR_TYPES).toContain("ORG");
    expect(CREATIVE_ACTOR_TYPES).toContain("CHR");
    expect(CREATIVE_ACTOR_TYPES).toContain("AUT");
  });

  test("does not include EDT or RDR", () => {
    expect(CREATIVE_ACTOR_TYPES).not.toContain("EDT");
    expect(CREATIVE_ACTOR_TYPES).not.toContain("RDR");
  });
});
