import { describe, expect, test } from "bun:test";
import {
  canAccessCharacterState,
  canAccessNatState,
  canAccessOrgState,
  applyConditionalAccess,
} from "../../src/core/visibility/rules-conditional.js";
import type { AccessAffiliation, AccessContext } from "../../src/core/visibility/types.js";

describe("canAccessCharacterState", () => {
  test("actor can always access own state", () => {
    expect(canAccessCharacterState("CHR-alice", "CHR-alice", "internal")).toBe(true);
    expect(canAccessCharacterState("CHR-alice", "CHR-alice", "observable")).toBe(true);
  });

  test("any actor can access observable fields of another character", () => {
    expect(canAccessCharacterState("CHR-bob", "CHR-alice", "observable")).toBe(true);
    expect(canAccessCharacterState("AUT", "CHR-alice", "observable")).toBe(true);
  });

  test("CHR cannot access another CHR internal fields", () => {
    expect(canAccessCharacterState("CHR-bob", "CHR-alice", "internal")).toBe(false);
    expect(canAccessCharacterState("AUT", "CHR-alice", "internal")).toBe(false);
  });

  test("EDT can access any character internal fields", () => {
    expect(canAccessCharacterState("EDT", "CHR-alice", "internal")).toBe(true);
  });
});

describe("canAccessNatState", () => {
  test("EDT can access all layers", () => {
    expect(canAccessNatState("EDT", "england", "secret")).toBe(true);
    expect(canAccessNatState("EDT", "england", "restricted")).toBe(true);
    expect(canAccessNatState("EDT", "england", "public")).toBe(true);
  });

  test("public layer is accessible to all", () => {
    expect(canAccessNatState("CHR-alice", "england", "public")).toBe(true);
    expect(canAccessNatState("NAT-france", "england", "public")).toBe(true);
  });

  test("restricted layer: own nationals have access", () => {
    expect(canAccessNatState("NAT-england", "england", "restricted")).toBe(true);
  });

  test("restricted layer: espionage capability >= 50 grants access", () => {
    expect(canAccessNatState("NAT-france", "england", "restricted", 60)).toBe(true);
    expect(canAccessNatState("NAT-france", "england", "restricted", 30)).toBe(false);
  });

  test("secret layer: only EDT", () => {
    expect(canAccessNatState("CHR-alice", "england", "secret")).toBe(false);
    expect(canAccessNatState("NAT-england", "england", "secret")).toBe(false);
    expect(canAccessNatState("NAT-france", "england", "secret", 100)).toBe(false);
  });
});

describe("canAccessOrgState", () => {
  test("EDT can access all layers", () => {
    expect(canAccessOrgState("EDT", "guild", "secret")).toBe(true);
  });

  test("non-member: public layer only", () => {
    expect(canAccessOrgState("CHR-alice", "guild", "public")).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "internal")).toBe(false);
    expect(canAccessOrgState("CHR-alice", "guild", "secret")).toBe(false);
  });

  const leaderAffiliation: AccessAffiliation = {
    entityId: "guild",
    role: "leader",
    accessLevel: "secret",
  };
  const officerAffiliation: AccessAffiliation = {
    entityId: "guild",
    role: "officer",
    accessLevel: "internal",
  };
  const memberAffiliation: AccessAffiliation = {
    entityId: "guild",
    role: "member",
    accessLevel: "public",
  };

  test("leader (secret accessLevel): all layers", () => {
    expect(canAccessOrgState("CHR-alice", "guild", "secret", leaderAffiliation)).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "internal", leaderAffiliation)).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "public", leaderAffiliation)).toBe(true);
  });

  test("officer (internal accessLevel): public + internal only", () => {
    expect(canAccessOrgState("CHR-alice", "guild", "public", officerAffiliation)).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "internal", officerAffiliation)).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "secret", officerAffiliation)).toBe(false);
  });

  test("general member (public accessLevel): public only", () => {
    expect(canAccessOrgState("CHR-alice", "guild", "public", memberAffiliation)).toBe(true);
    expect(canAccessOrgState("CHR-alice", "guild", "internal", memberAffiliation)).toBe(false);
  });
});

describe("applyConditionalAccess- NAT state", () => {
  test("allows public NAT layer for any actor", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "ST-NAT-england-public" };
    const result = applyConditionalAccess(ctx);
    expect(result?.allowed).toBe(true);
  });

  test("denies restricted NAT layer without espionage", () => {
    const ctx: AccessContext = {
      actorId: "CHR-alice",
      dataId: "ST-NAT-england-restricted",
      espionageCapability: 0,
    };
    const result = applyConditionalAccess(ctx);
    expect(result?.allowed).toBe(false);
  });

  test("allows restricted NAT layer with EDT override", () => {
    const ctx: AccessContext = {
      actorId: "CHR-alice",
      dataId: "ST-NAT-england-restricted",
      espionageCapability: 0,
      edtOverride: {
        reason: "CHR-alice is a spy with special clearance",
        scope: ["ST-NAT-england-restricted"],
        grantedTo: "CHR-alice",
        expiresAfterScene: 3,
      },
    };
    const result = applyConditionalAccess(ctx);
    expect(result?.allowed).toBe(true);
  });

  test("denies secret NAT layer even for own nation", () => {
    const ctx: AccessContext = {
      actorId: "NAT-england",
      dataId: "ST-NAT-england-secret",
    };
    const result = applyConditionalAccess(ctx);
    expect(result?.allowed).toBe(false);
  });

  test("allows secret NAT layer for EDT", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "ST-NAT-england-secret" };
    const result = applyConditionalAccess(ctx);
    expect(result?.allowed).toBe(true);
  });

  test("returns null for non-ST-NAT DataIds (no rule applied)", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-PUB-intro" };
    const result = applyConditionalAccess(ctx);
    expect(result).toBeNull();
  });
});
