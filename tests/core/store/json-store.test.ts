import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { readJson, writeJson, serializeJson, existsJson } from "../../../src/core/store/json-store.js";

const TMP_BASE = join(import.meta.dir, "../../.tmp");

describe("serializeJson", () => {
  test("sorts keys deterministically", () => {
    const data = { b: 2, a: 1, c: 3 };
    const result = serializeJson(data);
    expect(result).toBe('{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}\n');
  });

  test("sorts nested object keys", () => {
    const data = { outer: { z: 1, a: 2 } };
    const result = serializeJson(data);
    expect(result).toContain('"a": 2');
    const aIndex = result.indexOf('"a"');
    const zIndex = result.indexOf('"z"');
    expect(aIndex).toBeLessThan(zIndex);
  });

  test("preserves array order", () => {
    const data = { items: [3, 1, 2] };
    const result = serializeJson(data);
    const parsed = JSON.parse(result);
    expect(parsed.items).toEqual([3, 1, 2]);
  });

  test("ends with newline", () => {
    expect(serializeJson({})).toEndWith("\n");
  });
});

describe("readJson / writeJson", () => {
  let tmpDir: string;

  beforeEach(async () => {
    await mkdir(TMP_BASE, { recursive: true });
    tmpDir = await mkdtemp(join(TMP_BASE, "applicot-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("write then read roundtrip", async () => {
    const data = { id: "test", value: 42 };
    await writeJson(tmpDir, "data/test.json", data);
    const result = await readJson(tmpDir, "data/test.json");
    expect(result).toEqual(data);
  });

  test("read nonexistent returns null", async () => {
    const result = await readJson(tmpDir, "nonexistent.json");
    expect(result).toBeNull();
  });

  test("creates parent directories", async () => {
    await writeJson(tmpDir, "deep/nested/dir/file.json", { ok: true });
    const result = await readJson(tmpDir, "deep/nested/dir/file.json");
    expect(result).toEqual({ ok: true });
  });

  test("existsJson returns false for nonexistent", async () => {
    expect(await existsJson(tmpDir, "nope.json")).toBe(false);
  });

  test("existsJson returns true after write", async () => {
    await writeJson(tmpDir, "exists.json", {});
    expect(await existsJson(tmpDir, "exists.json")).toBe(true);
  });

  test("written JSON has sorted keys", async () => {
    await writeJson(tmpDir, "sorted.json", { z: 1, a: 2, m: 3 });
    const file = Bun.file(join(tmpDir, "sorted.json"));
    const text = await file.text();
    const aIndex = text.indexOf('"a"');
    const mIndex = text.indexOf('"m"');
    const zIndex = text.indexOf('"z"');
    expect(aIndex).toBeLessThan(mIndex);
    expect(mIndex).toBeLessThan(zIndex);
  });
});
