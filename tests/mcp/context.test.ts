import { describe, test, expect } from "bun:test";
import { createSessionContext, setActor, requireActor, canWrite } from "../../src/mcp/context.js";
import { ActorNotSetError, ActorAlreadySetError } from "../../src/mcp/errors.js";

describe("SessionContext", () => {
  test("creates with null actorId", () => {
    const ctx = createSessionContext("/tmp/test");
    expect(ctx.actorId).toBeNull();
    expect(ctx.novelRoot).toBe("/tmp/test");
  });

  test("setActor sets actorId", () => {
    const ctx = createSessionContext("/tmp/test");
    setActor(ctx, "EDT");
    expect(ctx.actorId).toBe("EDT");
  });

  test("setActor accepts valid actor IDs", () => {
    const ids = ["EDT", "AUT", "ENV", "CHR-alice", "NAT-kingdom_a", "ORG-guild_a", "RDR-ANA"];
    for (const id of ids) {
      const ctx = createSessionContext("/tmp/test");
      setActor(ctx, id);
      expect(ctx.actorId).toBe(id);
    }
  });

  test("setActor throws on invalid ID", () => {
    const ctx = createSessionContext("/tmp/test");
    expect(() => setActor(ctx, "INVALID")).toThrow();
  });

  test("setActor throws if already set", () => {
    const ctx = createSessionContext("/tmp/test");
    setActor(ctx, "EDT");
    expect(() => setActor(ctx, "AUT")).toThrow(ActorAlreadySetError);
  });

  test("requireActor throws if not set", () => {
    const ctx = createSessionContext("/tmp/test");
    expect(() => requireActor(ctx)).toThrow(ActorNotSetError);
  });

  test("requireActor returns actorId if set", () => {
    const ctx = createSessionContext("/tmp/test");
    setActor(ctx, "CHR-alice");
    expect(requireActor(ctx)).toBe("CHR-alice");
  });
});

describe("canWrite", () => {
  test("EDT can write anything", () => {
    expect(canWrite("EDT", "HO-PUB")).toBe(true);
    expect(canWrite("EDT", "ST-CHR-alice")).toBe(true);
    expect(canWrite("EDT", "TRK-FSH")).toBe(true);
  });

  test("CHR can write own recall only", () => {
    expect(canWrite("CHR-alice", "RCL-CHR-alice-recent")).toBe(true);
    expect(canWrite("CHR-alice", "RCL-CHR-alice-pinned")).toBe(true);
    expect(canWrite("CHR-alice", "RCL-CHR-bob-recent")).toBe(false);
    expect(canWrite("CHR-alice", "ST-CHR-alice")).toBe(false);
  });

  test("AUT can write scene output only", () => {
    expect(canWrite("AUT", "OUT-SCN-1-1")).toBe(true);
    expect(canWrite("AUT", "HO-PUB")).toBe(false);
  });

  test("ENV can write environment state only", () => {
    expect(canWrite("ENV", "ST-ENV")).toBe(true);
    expect(canWrite("ENV", "ST-CHR-alice")).toBe(false);
  });

  test("NAT can write own nation state only", () => {
    expect(canWrite("NAT-kingdom_a", "ST-NAT-kingdom_a-public")).toBe(true);
    expect(canWrite("NAT-kingdom_a", "ST-NAT-kingdom_b-public")).toBe(false);
  });

  test("ORG can write own org state only", () => {
    expect(canWrite("ORG-guild_a", "ST-ORG-guild_a")).toBe(true);
    expect(canWrite("ORG-guild_a", "ST-ORG-guild_b")).toBe(false);
  });

  test("RDR can write evaluation data only", () => {
    expect(canWrite("RDR-ANA", "EVL-quadrant")).toBe(true);
    expect(canWrite("RDR-ANA", "HO-PUB")).toBe(false);
  });
});
