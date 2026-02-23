import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  readMarkdown,
  writeMarkdown,
  existsMarkdown,
} from "../../../src/core/store/markdown-store.js";

describe("readMarkdown / writeMarkdown", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const tmpBase = join(import.meta.dir, "../../.tmp");
    await mkdir(tmpBase, { recursive: true });
    tmpDir = await mkdtemp(join(tmpBase, "applicot-md-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  test("write then read roundtrip", async () => {
    const content = "# Hello World\n\nThis is a test.\n";
    await writeMarkdown(tmpDir, "test.md", content);
    const result = await readMarkdown(tmpDir, "test.md");
    expect(result).toBe(content);
  });

  test("read nonexistent returns null", async () => {
    const result = await readMarkdown(tmpDir, "nonexistent.md");
    expect(result).toBeNull();
  });

  test("creates parent directories", async () => {
    const content = "nested content";
    await writeMarkdown(tmpDir, "a/b/c/file.md", content);
    const result = await readMarkdown(tmpDir, "a/b/c/file.md");
    expect(result).toBe(content);
  });

  test("existsMarkdown returns false for nonexistent", async () => {
    expect(await existsMarkdown(tmpDir, "nope.md")).toBe(false);
  });

  test("existsMarkdown returns true after write", async () => {
    await writeMarkdown(tmpDir, "exists.md", "hello");
    expect(await existsMarkdown(tmpDir, "exists.md")).toBe(true);
  });

  test("preserves unicode content", async () => {
    const content = "# 物語\n\nこれはテストです。\n";
    await writeMarkdown(tmpDir, "unicode.md", content);
    const result = await readMarkdown(tmpDir, "unicode.md");
    expect(result).toBe(content);
  });
});
