import { describe, test, expect } from "bun:test";
import { createVisibilityEngine } from "../../../src/core/visibility/engine.js";
import type { AccessContext } from "../../../src/core/visibility/types.js";

describe("VisibilityEngine", () => {
  const engine = createVisibilityEngine();

  // ── EDT: full access ──

  test("EDT can access public handout", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "HO-PUB" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("EDT can access private handout", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "HO-PRV-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("EDT can access GM handout", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "HO-GM" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("EDT can access foreshadowing", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "TRK-FSH" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("EDT can access evaluation report", () => {
    const ctx: AccessContext = { actorId: "EDT", dataId: "EVL-RPT" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  // ── CHR: limited access ──

  test("CHR can access own private handout", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-PRV-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("CHR cannot access other's private handout", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-PRV-bob" };
    const result = engine.canAccess(ctx);
    expect(result.allowed).toBe(false);
    expect(result.deniedBy?.level).toBe("1");
  });

  test("CHR cannot access GM handout", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-GM" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("CHR can access public handout", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-PUB" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  test("CHR cannot access GM scenario sub-handout", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "HO-GM-scenario" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  // ── AUT: restricted ──

  test("AUT cannot access any private handout", () => {
    const ctx: AccessContext = { actorId: "AUT", dataId: "HO-PRV-alice" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("AUT cannot access GM handout", () => {
    const ctx: AccessContext = { actorId: "AUT", dataId: "HO-GM" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("AUT can access public handout", () => {
    const ctx: AccessContext = { actorId: "AUT", dataId: "HO-PUB" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  // ── RDR: most restricted ──

  test("RDR cannot access any handout", () => {
    const ctx1: AccessContext = { actorId: "RDR-ANA", dataId: "HO-PUB" };
    expect(engine.canAccess(ctx1).allowed).toBe(false);

    const ctx2: AccessContext = { actorId: "RDR-ANA", dataId: "HO-PRV-alice" };
    expect(engine.canAccess(ctx2).allowed).toBe(false);

    const ctx3: AccessContext = { actorId: "RDR-ANA", dataId: "HO-GM" };
    expect(engine.canAccess(ctx3).allowed).toBe(false);
  });

  test("RDR cannot see other RDR evaluations", () => {
    const ctx: AccessContext = { actorId: "RDR-ANA", dataId: "RDR-EMO" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("RDR can see own evaluation data", () => {
    const ctx: AccessContext = { actorId: "RDR-ANA", dataId: "RDR-ANA" };
    expect(engine.canAccess(ctx).allowed).toBe(true);
  });

  // ── Creative actors: no evaluation access ──

  test("CHR cannot access evaluation data", () => {
    const ctx: AccessContext = { actorId: "CHR-alice", dataId: "EVL-quadrant" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("AUT cannot access evaluation data", () => {
    const ctx: AccessContext = { actorId: "AUT", dataId: "EVL-quadrant" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("ENV cannot access evaluation data", () => {
    const ctx: AccessContext = { actorId: "ENV", dataId: "EVL-quadrant" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("NAT cannot access evaluation data", () => {
    const ctx: AccessContext = { actorId: "NAT-kingdom_a", dataId: "EVL-quadrant" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });

  test("ORG cannot access evaluation data", () => {
    const ctx: AccessContext = { actorId: "ORG-guild_a", dataId: "EVL-quadrant" };
    expect(engine.canAccess(ctx).allowed).toBe(false);
  });
});
