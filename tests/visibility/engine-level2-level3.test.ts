import { describe, expect, test } from "bun:test";
import { createVisibilityEngine } from "../../src/core/visibility/engine.js";
import type { AccessContext } from "../../src/core/visibility/types.js";

describe("Level 2 barriers (CHR state access)", () => {
  const engine = createVisibilityEngine();

  test("CHR-alice can access own state ST-CHR-alice", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "ST-CHR-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("CHR-alice cannot access CHR-bob state ST-CHR-bob (Level 2)", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "ST-CHR-bob" };
    const result = engine.canAccess(ctx);
    expect(result.allowed).toBe(false);
  });

  test("CHR-alice can access CHR-bob state with EdtOverride", () => {
    const ctx: AccessContext = {
      actorId: "CHR-alice",
      dataId: "ST-CHR-bob",
      edtOverride: {
        reason: "CHR-alice has telepathy",
        scope: ["ST-CHR-bob"],
        grantedTo: "CHR-alice",
        expiresAfterScene: 2,
      },
    };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("EDT can access any character state (no Level 2 barrier)", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "ST-CHR-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });
});

describe("Level 3 barriers (AUT state access, config-switchable)", () => {
  test("AUT cannot access ST-CHR-* by default (Level 3)", () => {
    const engine = createVisibilityEngine();
    const ctx: AccessContext = { actorId: "AUT", dataId: "ST-CHR-alice" };
    const result = engine.canAccess(ctx);
    expect(result.allowed).toBe(false);
  });

  test("AUT cannot access ST-NAT-* by default (Level 3)", () => {
    const engine = createVisibilityEngine();
    const ctx: AccessContext = { actorId: "AUT", dataId: "ST-NAT-england-public" };
    // Level 3 fires before NAT conditional access
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("AUT CAN access ST-CHR-* when Level 3 is disabled", () => {
    const engine = createVisibilityEngine({ enableLevel3Barriers: false });
    const ctx: AccessContext = { actorId: "AUT", dataId: "ST-CHR-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("AUT CAN access ST-NAT-*-public when Level 3 is disabled", () => {
    const engine = createVisibilityEngine({ enableLevel3Barriers: false });
    const ctx: AccessContext = { actorId: "AUT", dataId: "ST-NAT-england-public" };
    // Without Level 3, falls through to conditional access which allows public layer
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });
});
