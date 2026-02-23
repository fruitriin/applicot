import { describe, test, expect } from "bun:test";
import { createSessionContext } from "../../../src/mcp/context.js";
import { handleSetActor } from "../../../src/mcp/tools/actor.js";

describe("handleSetActor", () => {
  test("sets actor successfully", () => {
    const ctx = createSessionContext("/tmp/test");
    const result = handleSetActor(ctx, { actorId: "EDT" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("EDT");
    expect(ctx.actorId).toBe("EDT");
  });

  test("rejects duplicate set", () => {
    const ctx = createSessionContext("/tmp/test");
    handleSetActor(ctx, { actorId: "EDT" });
    const result = handleSetActor(ctx, { actorId: "AUT" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("already set");
  });

  test("rejects invalid actor ID", () => {
    const ctx = createSessionContext("/tmp/test");
    const result = handleSetActor(ctx, { actorId: "INVALID" });
    expect(result.isError).toBe(true);
  });
});
