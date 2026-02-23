import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createSessionContext, setActor } from "../../../src/mcp/context.js";
import { createRecallStore } from "../../../src/mcp/recall/store.js";
import {
  handleRemember,
  handleRecallRecent,
  handleSearchMemories,
  handlePinMemory,
  handleListMemories,
} from "../../../src/mcp/tools/recall.js";

describe("recall tools", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const tmpBase = join(import.meta.dir, "../../.tmp");
    await mkdir(tmpBase, { recursive: true });
    tmpDir = await mkdtemp(join(tmpBase, "applicot-mcp-recall-"));
    await mkdir(join(tmpDir, "recall/CHR-alice"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("remember stores a memory", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    const result = await handleRemember(ctx, recallStore, {
      content: "Met the guild master",
      sceneId: "cycle_1-scene_1",
      emotion: "surprise",
      importance: 75,
      keywords: ["guild master", "meeting"],
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Memory stored");

    // Verify stored
    const entries = await recallStore.getEntries("CHR-alice", "recent");
    expect(entries.length).toBe(1);
    expect(entries[0].content).toBe("Met the guild master");
    expect(entries[0].importance).toBe(75);
  });

  test("recall_recent retrieves recent memories", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    // Add some memories
    await handleRemember(ctx, recallStore, {
      content: "Memory A",
      sceneId: "s1",
    });
    await handleRemember(ctx, recallStore, {
      content: "Memory B",
      sceneId: "s2",
    });

    const result = await handleRecallRecent(ctx, recallStore, { limit: 10 });
    expect(result.isError).toBeUndefined();
    const entries = JSON.parse(result.content[0].text);
    expect(entries.length).toBe(2);
  });

  test("recall_recent respects limit", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    for (let i = 0; i < 5; i++) {
      await handleRemember(ctx, recallStore, {
        content: `Memory ${i}`,
        sceneId: `s${i}`,
      });
    }

    const result = await handleRecallRecent(ctx, recallStore, { limit: 3 });
    const entries = JSON.parse(result.content[0].text);
    expect(entries.length).toBe(3);
  });

  test("search_memories by query", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    await handleRemember(ctx, recallStore, {
      content: "Found a secret passage",
      sceneId: "s1",
      keywords: ["secret", "passage"],
    });
    await handleRemember(ctx, recallStore, {
      content: "Had lunch",
      sceneId: "s2",
    });

    const result = await handleSearchMemories(ctx, recallStore, { query: "secret" });
    const entries = JSON.parse(result.content[0].text);
    expect(entries.length).toBe(1);
    expect(entries[0].content).toContain("secret passage");
  });

  test("search_memories by emotion", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    await handleRemember(ctx, recallStore, {
      content: "Scary moment",
      sceneId: "s1",
      emotion: "fear",
    });
    await handleRemember(ctx, recallStore, {
      content: "Happy moment",
      sceneId: "s2",
      emotion: "joy",
    });

    const result = await handleSearchMemories(ctx, recallStore, { emotion: "fear" });
    const entries = JSON.parse(result.content[0].text);
    expect(entries.length).toBe(1);
    expect(entries[0].content).toBe("Scary moment");
  });

  test("pin_memory moves to pinned layer", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    await handleRemember(ctx, recallStore, {
      content: "Important memory",
      sceneId: "s1",
      importance: 90,
    });

    const recent = await recallStore.getEntries("CHR-alice", "recent");
    const memoryId = recent[0].id;

    const result = await handlePinMemory(ctx, recallStore, { memoryId });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("pinned successfully");

    // Verify moved
    const recentAfter = await recallStore.getEntries("CHR-alice", "recent");
    expect(recentAfter.length).toBe(0);
    const pinned = await recallStore.getEntries("CHR-alice", "pinned");
    expect(pinned.length).toBe(1);
    expect(pinned[0].content).toBe("Important memory");
  });

  test("list_memories shows summary", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    await handleRemember(ctx, recallStore, { content: "M1", sceneId: "s1" });
    await handleRemember(ctx, recallStore, { content: "M2", sceneId: "s2" });

    const result = await handleListMemories(ctx, recallStore, {});
    expect(result.content[0].text).toContain("recent: 2 entries");
  });

  test("list_memories by layer", async () => {
    const ctx = createSessionContext(tmpDir);
    setActor(ctx, "CHR-alice");
    const recallStore = createRecallStore(tmpDir);

    await handleRemember(ctx, recallStore, { content: "M1", sceneId: "s1" });

    const result = await handleListMemories(ctx, recallStore, { layer: "recent" });
    expect(result.content[0].text).toContain("recent: 1 entries");
  });

  test("remember fails without set_actor", async () => {
    const ctx = createSessionContext(tmpDir);
    const recallStore = createRecallStore(tmpDir);
    const result = await handleRemember(ctx, recallStore, {
      content: "test",
      sceneId: "s1",
    });
    expect(result.isError).toBe(true);
  });
});
