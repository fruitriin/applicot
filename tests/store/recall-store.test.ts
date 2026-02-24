import { describe, expect, test } from "bun:test";
import {
  RecallViolationError,
  validateRecallSource,
  validateAndPrepareRecall,
  writeRecall,
} from "../../src/core/store/recall-store.js";
import { createVisibilityEngine } from "../../src/core/visibility/engine.js";
import type { RecallEntry } from "../../src/core/types/recall.js";

const engine = createVisibilityEngine();

const sampleEntry: RecallEntry = {
  id: "mem-001",
  layer: "recent",
  sceneId: "scene-1",
  content: "Alice saw the guild notice board.",
  emotionTags: ["curious"],
  keywords: ["guild", "notice"],
  importance: 60,
  createdAt: "2026-02-24T00:00:00Z",
  emotionalIntensity: 40,
};

describe("validateRecallSource", () => {
  test("allows memory from accessible data", () => {
    expect(() =>
      validateRecallSource(
        "CHR-alice",
        { dataId: "ST-CHR-alice" },
        engine,
      ),
    ).not.toThrow();
  });

  test("throws RecallViolationError for inaccessible data", () => {
    expect(() =>
      validateRecallSource(
        "CHR-alice",
        { dataId: "ST-CHR-bob" },
        engine,
      ),
    ).toThrow(RecallViolationError);
  });

  test("allows memory with EdtOverride", () => {
    expect(() =>
      validateRecallSource(
        "CHR-alice",
        { dataId: "ST-CHR-bob" },
        engine,
        {
          edtOverride: {
            reason: "telepathy",
            scope: ["ST-CHR-bob"],
            grantedTo: "CHR-alice",
            expiresAfterScene: 1,
          },
        },
      ),
    ).not.toThrow();
  });
});

describe("RecallViolationError", () => {
  test("has correct name and properties", () => {
    const err = new RecallViolationError("CHR-alice", "HO-GM");
    expect(err.name).toBe("RecallViolationError");
    expect(err.actorId).toBe("CHR-alice");
    expect(err.dataId).toBe("HO-GM");
    expect(err.message).toContain("CHR-alice");
    expect(err.message).toContain("HO-GM");
  });
});

describe("validateAndPrepareRecall", () => {
  test("returns entry when all sources are valid", () => {
    const result = validateAndPrepareRecall(
      "CHR-alice",
      sampleEntry,
      [{ dataId: "ST-CHR-alice" }, { dataId: "HO-PUB-world" }],
      engine,
    );
    expect(result).toBe(sampleEntry);
  });

  test("throws when any source is invalid", () => {
    expect(() =>
      validateAndPrepareRecall(
        "CHR-alice",
        sampleEntry,
        [{ dataId: "ST-CHR-alice" }, { dataId: "HO-GM" }],
        engine,
      ),
    ).toThrow(RecallViolationError);
  });
});

describe("writeRecall", () => {
  test("calls writer when sources are valid", async () => {
    let written: RecallEntry | null = null;
    await writeRecall(
      "CHR-alice",
      sampleEntry,
      [{ dataId: "ST-CHR-alice" }],
      engine,
      async (_actorId, entry) => { written = entry; },
    );
    expect(written as unknown).toBe(sampleEntry);
  });

  test("does not call writer when source is invalid", async () => {
    let written = false;
    await expect(
      writeRecall(
        "CHR-alice",
        sampleEntry,
        [{ dataId: "ST-CHR-bob" }],
        engine,
        async () => { written = true; },
      ),
    ).rejects.toThrow(RecallViolationError);
    expect(written).toBe(false);
  });
});
