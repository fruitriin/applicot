import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { createSessionContext, setActor } from "../../../src/mcp/context.js";
import { handleReadData, handleWriteData, handleListData } from "../../../src/mcp/tools/store.js";
import { writeJson } from "../../../src/core/store/json-store.js";
import { writeMarkdown } from "../../../src/core/store/markdown-store.js";
import { mkdir } from "node:fs/promises";

describe("store tools", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const tmpBase = join(import.meta.dir, "../../.tmp");
    await mkdir(tmpBase, { recursive: true });
    tmpDir = await mkdtemp(join(tmpBase, "applicot-mcp-store-"));
    // Create test data structure
    await mkdir(join(tmpDir, "handouts/public"), { recursive: true });
    await mkdir(join(tmpDir, "handouts/private"), { recursive: true });
    await mkdir(join(tmpDir, "handouts/gm"), { recursive: true });
    await mkdir(join(tmpDir, "state/characters"), { recursive: true });
    await writeMarkdown(tmpDir, "handouts/public/world.md", "# World\n\nPublic info.");
    await writeMarkdown(tmpDir, "handouts/private/alice.md", "# Alice Secret\n\nAlice's secret.");
    await writeMarkdown(tmpDir, "handouts/gm/scenario.md", "# GM Scenario\n\nSecret ending.");
    await writeJson(tmpDir, "state/characters/alice.json", {
      id: "alice",
      name: "Alice",
      alive: true,
    });
    await writeJson(tmpDir, "state/characters/bob.json", {
      id: "bob",
      name: "Bob",
      alive: true,
    });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  // ── read_data ──

  test("read_data fails without set_actor", async () => {
    const ctx = createSessionContext(tmpDir);
    const result = await handleReadData(ctx, { dataId: "HO-PUB-world" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Actor not set");
  });

  test("EDT can read public handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleReadData(ctx, { dataId: "HO-PUB-world" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Public info");
  });

  test("EDT can read private handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleReadData(ctx, { dataId: "HO-PRV-alice" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Alice's secret");
  });

  test("EDT can read GM handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleReadData(ctx, { dataId: "HO-GM-scenario" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Secret ending");
  });

  test("CHR-alice can read own private handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const result = await handleReadData(ctx, { dataId: "HO-PRV-alice" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Alice's secret");
  });

  test("CHR-alice cannot read bob's private handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const result = await handleReadData(ctx, { dataId: "HO-PRV-bob" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Access denied");
  });

  test("CHR-alice cannot read GM handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const result = await handleReadData(ctx, { dataId: "HO-GM-scenario" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Access denied");
  });

  test("AUT cannot read private handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "AUT");
    const result = await handleReadData(ctx, { dataId: "HO-PRV-alice" });
    expect(result.isError).toBe(true);
  });

  test("RDR cannot read any handout", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "RDR-ANA");
    const result = await handleReadData(ctx, { dataId: "HO-PUB-world" });
    expect(result.isError).toBe(true);
  });

  test("read_data returns 'not found' for nonexistent data", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleReadData(ctx, { dataId: "ST-CHR-nobody" });
    expect(result.content[0].text).toContain("No data found");
  });

  test("read_data returns JSON as formatted string", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleReadData(ctx, { dataId: "ST-CHR-alice" });
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.name).toBe("Alice");
  });

  // ── write_data ──

  test("EDT can write to any data", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleWriteData(ctx, {
      dataId: "ST-CHR-alice",
      content: JSON.stringify({ id: "alice", name: "Alice Updated", alive: true }),
    });
    expect(result.isError).toBeUndefined();

    // Verify written
    const read = await handleReadData(ctx, { dataId: "ST-CHR-alice" });
    const parsed = JSON.parse(read.content[0].text);
    expect(parsed.name).toBe("Alice Updated");
  });

  test("CHR cannot write to character state", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const result = await handleWriteData(ctx, {
      dataId: "ST-CHR-alice",
      content: JSON.stringify({ id: "alice" }),
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Write denied");
  });

  // ── list_data ──

  test("EDT can list all characters", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "EDT");
    const result = await handleListData(ctx, { prefix: "ST-CHR" });
    expect(result.isError).toBeUndefined();
    const ids = JSON.parse(result.content[0].text);
    expect(ids).toContain("ST-CHR-alice");
    expect(ids).toContain("ST-CHR-bob");
  });
});
