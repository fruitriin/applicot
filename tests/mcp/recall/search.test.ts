import { describe, test, expect } from "bun:test";
import { searchEntries } from "../../../src/mcp/recall/search.js";
import type { RecallEntry } from "../../../src/core/types/recall.js";

const entries: RecallEntry[] = [
  {
    id: "m1",
    layer: "recent",
    sceneId: "s1",
    content: "Found a hidden treasure in the castle",
    emotionTags: ["excitement", "surprise"],
    keywords: ["treasure", "castle"],
    importance: 80,
    createdAt: "2026-01-01T00:00:00Z",
    emotionalIntensity: 70,
  },
  {
    id: "m2",
    layer: "recent",
    sceneId: "s2",
    content: "Had a quiet conversation with Bob",
    emotionTags: ["calm"],
    keywords: ["bob", "conversation"],
    importance: 30,
    createdAt: "2026-01-02T00:00:00Z",
    emotionalIntensity: 20,
  },
  {
    id: "m3",
    layer: "midterm",
    sceneId: "s3",
    content: "Witnessed the king's betrayal",
    emotionTags: ["shock", "fear"],
    keywords: ["king", "betrayal"],
    importance: 95,
    createdAt: "2026-01-03T00:00:00Z",
    emotionalIntensity: 90,
  },
];

describe("searchEntries", () => {
  test("returns all entries when no filters", () => {
    const results = searchEntries(entries, {});
    expect(results.length).toBe(3);
    // Sorted by importance descending
    expect(results[0].id).toBe("m3");
    expect(results[1].id).toBe("m1");
    expect(results[2].id).toBe("m2");
  });

  test("filters by query in content", () => {
    const results = searchEntries(entries, { query: "treasure" });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m1");
  });

  test("filters by query in keywords", () => {
    const results = searchEntries(entries, { query: "bob" });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m2");
  });

  test("query is case-insensitive", () => {
    const results = searchEntries(entries, { query: "CASTLE" });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m1");
  });

  test("filters by emotion", () => {
    const results = searchEntries(entries, { emotion: "fear" });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m3");
  });

  test("filters by tags (AND)", () => {
    const results = searchEntries(entries, { tags: ["excitement", "surprise"] });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m1");
  });

  test("filters by minImportance", () => {
    const results = searchEntries(entries, { minImportance: 50 });
    expect(results.length).toBe(2);
    expect(results[0].id).toBe("m3");
    expect(results[1].id).toBe("m1");
  });

  test("combines multiple filters", () => {
    const results = searchEntries(entries, { query: "king", minImportance: 80 });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("m3");
  });

  test("returns empty for no matches", () => {
    const results = searchEntries(entries, { query: "nonexistent" });
    expect(results.length).toBe(0);
  });
});
