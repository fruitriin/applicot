import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { serializeJson } from "../core/store/json-store.js";
import { generateNovelClaudeMd, type NovelClaudeMdConfig } from "../../templates/novel-claude-md.js";
import { generateMcpJson } from "../../templates/mcp-json.js";
import { generateEdtSoul } from "../../templates/soul-md/edt.js";
import { generateChrSoul } from "../../templates/soul-md/chr.js";
import { generateAutSoul } from "../../templates/soul-md/aut.js";
import { generateEnvSoul } from "../../templates/soul-md/env.js";
import { generateNatSoul } from "../../templates/soul-md/nat.js";
import { generateOrgSoul } from "../../templates/soul-md/org.js";
import { generateRdrSoul, type ReaderPersona } from "../../templates/soul-md/rdr.js";

export interface ScaffoldConfig {
  novelRoot: string;
  applicotPath: string;
  title?: string;
  genre?: string;
  characters?: { id: string; name: string }[];
  nations?: { id: string; name: string }[];
  organizations?: { id: string; name: string }[];
  readerPersonas?: ReaderPersona[];
}

/**
 * Generate the novel directory structure (scaffold).
 * Creates directories, initial data files, CLAUDE.md, SOUL.md files, and .mcp.json.
 */
export async function scaffoldNovelDirectory(config: ScaffoldConfig): Promise<void> {
  const { novelRoot } = config;
  const characters = config.characters ?? [];
  const nations = config.nations ?? [];
  const organizations = config.organizations ?? [];
  const readerPersonas = config.readerPersonas ?? (["ANA", "EMO", "CRT", "NAV"] as ReaderPersona[]);

  // ── Data directories ──
  const dirs = [
    "handouts/public",
    "handouts/private",
    "handouts/gm",
    "state/characters",
    "state/organizations",
    "state/nations",
    "scenes",
    "recall",
    "campaign/arcs",
    "evaluation",
    "meta",
  ];

  // ── Actor directories ──
  dirs.push("actors/EDT", "actors/AUT", "actors/ENV");
  for (const chr of characters) {
    dirs.push(`actors/CHR-${chr.id}`);
  }
  for (const nat of nations) {
    dirs.push(`actors/NAT-${nat.id}`);
  }
  for (const org of organizations) {
    dirs.push(`actors/ORG-${org.id}`);
  }
  for (const persona of readerPersonas) {
    dirs.push(`actors/RDR-${persona}`);
  }

  for (const dir of dirs) {
    await mkdir(join(novelRoot, dir), { recursive: true });
  }

  // ── Initial JSON data files ──
  const jsonFiles: Record<string, unknown> = {
    "state/environment.json": {},
    "state/relationships.json": { edges: [] },
    "state/foreshadowing.json": [],
    "state/tension_curve.json": [],
    "state/timeline.json": [],
    "meta/config.json": {
      genre: config.genre ?? "",
      scale: "medium",
      title: config.title ?? "",
      createdAt: new Date().toISOString(),
    },
  };

  for (const [path, data] of Object.entries(jsonFiles)) {
    await Bun.write(join(novelRoot, path), serializeJson(data));
  }

  // ── Initial Markdown data files ──
  const mdFiles: Record<string, string> = {
    "campaign/consequences.md": "# Consequences Ledger\n\n<!-- Track narrative consequences across cycles -->\n",
    "meta/session_log.md": "# Session Log\n\n<!-- Automatic session logging -->\n",
  };

  for (const [path, content] of Object.entries(mdFiles)) {
    await Bun.write(join(novelRoot, path), content);
  }

  // ── CLAUDE.md ──
  const claudeMdConfig: NovelClaudeMdConfig = {
    title: config.title,
    genre: config.genre,
    characters,
    nations,
    organizations,
    readerPersonas,
  };
  await Bun.write(join(novelRoot, "CLAUDE.md"), generateNovelClaudeMd(claudeMdConfig));

  // ── .mcp.json ──
  const mcpJson = generateMcpJson(config.applicotPath);
  await Bun.write(join(novelRoot, ".mcp.json"), serializeJson(mcpJson));

  // ── SOUL.md files ──
  await Bun.write(join(novelRoot, "actors/EDT/SOUL.md"), generateEdtSoul());
  await Bun.write(join(novelRoot, "actors/AUT/SOUL.md"), generateAutSoul());
  await Bun.write(join(novelRoot, "actors/ENV/SOUL.md"), generateEnvSoul());

  for (const chr of characters) {
    await Bun.write(
      join(novelRoot, `actors/CHR-${chr.id}/SOUL.md`),
      generateChrSoul({ id: chr.id, name: chr.name }),
    );
  }

  for (const nat of nations) {
    await Bun.write(
      join(novelRoot, `actors/NAT-${nat.id}/SOUL.md`),
      generateNatSoul({ id: nat.id, name: nat.name }),
    );
  }

  for (const org of organizations) {
    await Bun.write(
      join(novelRoot, `actors/ORG-${org.id}/SOUL.md`),
      generateOrgSoul({ id: org.id, name: org.name }),
    );
  }

  for (const persona of readerPersonas) {
    await Bun.write(
      join(novelRoot, `actors/RDR-${persona}/SOUL.md`),
      generateRdrSoul(persona),
    );
  }
}

// CLI entry point
if (import.meta.main) {
  const novelDir = process.argv[2] ?? process.env.APPLICOT_NOVEL_DIR ?? "./novel";
  const applicotPath = resolve(import.meta.dir, "../..");

  console.log(`Scaffolding novel directory at: ${novelDir}`);
  console.log(`Applicot path: ${applicotPath}`);

  await scaffoldNovelDirectory({
    novelRoot: novelDir,
    applicotPath,
    title: "New Novel",
    characters: [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ],
  });

  console.log("Done! Novel directory structure created.");
  console.log("Next steps:");
  console.log("  1. Edit handouts/ to define your world and characters");
  console.log("  2. Run: actors/EDT/SOUL.md を読んで実行して");
}
