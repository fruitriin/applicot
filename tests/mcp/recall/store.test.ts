import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createRecallStore } from "../../../src/mcp/recall/store.js";
import type { RecallEntry } from "../../../src/core/types/recall.js";

function makeEntry(overrides: Partial<RecallEntry> = {}): RecallEntry {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    layer: "recent",
    sceneId: "cycle_1-scene_1",
    content: "Test memory",
    emotionTags: [],
    keywords: [],
    importance: 50,
    createdAt: new Date().toISOString(),
    emotionalIntensity: 30,
    ...overrides,
  };
}

describe("RecallStore", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const tmpBase = join(import.meta.dir, "../../.tmp");
    await mkdir(tmpBase, { recursive: true });
    tmpDir = await mkdtemp(join(tmpBase, "applicot-recall-store-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("addEntry and getEntries", async () => {
    const store = createRecallStore(tmpDir);
    const entry = makeEntry({ id: "m1" });
    await store.addEntry("CHR-alice", entry);

    const entries = await store.getEntries("CHR-alice", "recent");
    expect(entries.length).toBe(1);
    expect(entries[0].id).toBe("m1");
  });

  test("getEntries returns empty for no data", async () => {
    const store = createRecallStore(tmpDir);
    const entries = await store.getEntries("CHR-alice", "recent");
    expect(entries).toEqual([]);
  });

  test("getAllEntries collects from all layers", async () => {
    const store = createRecallStore(tmpDir);
    await store.addEntry("CHR-alice", makeEntry({ id: "m1", layer: "recent" }));
    await store.addEntry("CHR-alice", makeEntry({ id: "m2", layer: "pinned" }));

    const all = await store.getAllEntries("CHR-alice");
    expect(all.length).toBe(2);
  });

  test("findEntry locates across layers", async () => {
    const store = createRecallStore(tmpDir);
    await store.addEntry("CHR-alice", makeEntry({ id: "m1", layer: "recent" }));
    await store.addEntry("CHR-alice", makeEntry({ id: "m2", layer: "midterm" }));

    const found = await store.findEntry("CHR-alice", "m2");
    expect(found).not.toBeNull();
    expect(found!.layer).toBe("midterm");
    expect(found!.entry.id).toBe("m2");
  });

  test("findEntry returns null for nonexistent", async () => {
    const store = createRecallStore(tmpDir);
    const found = await store.findEntry("CHR-alice", "nonexistent");
    expect(found).toBeNull();
  });

  test("moveEntry moves between layers", async () => {
    const store = createRecallStore(tmpDir);
    await store.addEntry("CHR-alice", makeEntry({ id: "m1", layer: "recent" }));

    await store.moveEntry("CHR-alice", "m1", "recent", "pinned");

    const recent = await store.getEntries("CHR-alice", "recent");
    expect(recent.length).toBe(0);

    const pinned = await store.getEntries("CHR-alice", "pinned");
    expect(pinned.length).toBe(1);
    expect(pinned[0].id).toBe("m1");
    expect(pinned[0].layer).toBe("pinned");
  });

  test("removeEntry removes from layer", async () => {
    const store = createRecallStore(tmpDir);
    await store.addEntry("CHR-alice", makeEntry({ id: "m1" }));
    await store.addEntry("CHR-alice", makeEntry({ id: "m2" }));

    await store.removeEntry("CHR-alice", "m1", "recent");

    const entries = await store.getEntries("CHR-alice", "recent");
    expect(entries.length).toBe(1);
    expect(entries[0].id).toBe("m2");
  });

  test("actors have separate storage", async () => {
    const store = createRecallStore(tmpDir);
    await store.addEntry("CHR-alice", makeEntry({ id: "a1" }));
    await store.addEntry("CHR-bob", makeEntry({ id: "b1" }));

    const aliceEntries = await store.getEntries("CHR-alice", "recent");
    expect(aliceEntries.length).toBe(1);
    expect(aliceEntries[0].id).toBe("a1");

    const bobEntries = await store.getEntries("CHR-bob", "recent");
    expect(bobEntries.length).toBe(1);
    expect(bobEntries[0].id).toBe("b1");
  });
});
