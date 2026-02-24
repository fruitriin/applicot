import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  checkRecallFile,
  checkCharacterStateFile,
  checkOrganizationStateFile,
  runChecks,
} from "../../../src/git/hooks/pre-commit.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "applicot-hook-test-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function writeJson(dir: string, relPath: string, data: unknown): Promise<string> {
  const abs = join(dir, relPath);
  const parent = abs.substring(0, abs.lastIndexOf("/"));
  Bun.spawnSync(["mkdir", "-p", parent]);
  await Bun.write(abs, JSON.stringify(data, null, 2));
  return abs;
}

function makeRecallMemory(actorId: string) {
  return {
    actorId,
    entries: [
      {
        id: "entry-1",
        layer: "recent",
        sceneId: "cycle_1-scene_1",
        content: "Something happened",
        emotionTags: ["surprise"],
        keywords: ["letter"],
        importance: 70,
        createdAt: "2026-02-24T12:00:00.000Z",
        emotionalIntensity: 60,
      },
    ],
  };
}

function makeCharacterState(id: string) {
  return {
    id,
    name: "Alice",
    alive: true,
    location: "tavern",
    observable: {
      appearance: "tall with red hair",
      publicTitle: "Traveler",
      visibleCondition: "calm",
    },
    internal: {
      stress: 40,
      loyalty: {},
      desires: { freedom: 80 },
    },
    affiliations: [],
  };
}

function makeOrganizationState(id: string) {
  return {
    id,
    name: "The Guild",
    type: "trade",
    public: {
      description: "A trade organization",
      publicGoals: ["Profit"],
      knownMembers: [],
    },
    internal: {
      resources: { gold: 5000 },
      internalPolicies: ["No outsiders"],
      factions: [],
    },
    secret: {
      secretAlliances: [],
      secretResources: {},
    },
  };
}

describe("checkRecallFile", () => {
  test("passes valid recall file with matching actorId", async () => {
    await withTempDir(async (dir) => {
      const abs = await writeJson(dir, "recall/chr_alice/recent.json", makeRecallMemory("chr_alice"));
      const vs = await checkRecallFile("recall/chr_alice/recent.json", abs);
      expect(vs).toHaveLength(0);
    });
  });

  test("returns actor-id-mismatch when path actorId differs from file actorId", async () => {
    await withTempDir(async (dir) => {
      const abs = await writeJson(dir, "recall/chr_alice/recent.json", makeRecallMemory("chr_bob"));
      const vs = await checkRecallFile("recall/chr_alice/recent.json", abs);
      expect(vs.some((v) => v.check === "actor-id-mismatch")).toBe(true);
    });
  });

  test("returns schema-violation for invalid recall structure", async () => {
    await withTempDir(async (dir) => {
      const bad = { actorId: "chr_alice", entries: [{ id: 123 }] };
      const abs = await writeJson(dir, "recall/chr_alice/recent.json", bad);
      const vs = await checkRecallFile("recall/chr_alice/recent.json", abs);
      expect(vs.some((v) => v.check === "schema-violation")).toBe(true);
    });
  });

  test("returns parse-error for non-JSON content", async () => {
    await withTempDir(async (dir) => {
      const abs = join(dir, "recall/chr_alice/recent.json");
      Bun.spawnSync(["mkdir", "-p", join(dir, "recall/chr_alice")]);
      await Bun.write(abs, "not json {{{");
      const vs = await checkRecallFile("recall/chr_alice/recent.json", abs);
      expect(vs.some((v) => v.check === "parse-error")).toBe(true);
    });
  });

  test("ignores files outside recall/ directory", async () => {
    await withTempDir(async (dir) => {
      const abs = await writeJson(dir, "state/characters/alice.json", {});
      const vs = await checkRecallFile("state/characters/alice.json", abs);
      expect(vs).toHaveLength(0);
    });
  });
});

describe("checkCharacterStateFile", () => {
  test("passes valid character state", async () => {
    await withTempDir(async (dir) => {
      const abs = await writeJson(dir, "state/characters/alice.json", makeCharacterState("alice"));
      const vs = await checkCharacterStateFile("state/characters/alice.json", abs);
      expect(vs).toHaveLength(0);
    });
  });

  test("returns schema-violation for invalid character state", async () => {
    await withTempDir(async (dir) => {
      const bad = { id: "alice" };
      const abs = await writeJson(dir, "state/characters/alice.json", bad);
      const vs = await checkCharacterStateFile("state/characters/alice.json", abs);
      expect(vs.some((v) => v.check === "schema-violation")).toBe(true);
    });
  });
});

describe("checkOrganizationStateFile", () => {
  test("passes valid organization state", async () => {
    await withTempDir(async (dir) => {
      const abs = await writeJson(dir, "state/organizations/guild.json", makeOrganizationState("guild"));
      const vs = await checkOrganizationStateFile("state/organizations/guild.json", abs);
      expect(vs).toHaveLength(0);
    });
  });

  test("returns schema-violation for invalid org state", async () => {
    await withTempDir(async (dir) => {
      const bad = { id: "guild", name: "Guild" };
      const abs = await writeJson(dir, "state/organizations/guild.json", bad);
      const vs = await checkOrganizationStateFile("state/organizations/guild.json", abs);
      expect(vs.some((v) => v.check === "schema-violation")).toBe(true);
    });
  });
});

describe("runChecks", () => {
  test("returns no violations when no files are staged", async () => {
    await withTempDir(async (dir) => {
      const result = await runChecks(dir);
      expect(result.violations).toHaveLength(0);
      expect(result.checkedFiles).toBe(0);
    });
  });
});