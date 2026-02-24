/**
 * Pre-commit hook for the novel repository.
 *
 * Validates staged files for information barrier violations before commit.
 * Exit 0 = pass, Exit 1 = violation found.
 *
 * Install:
 *   echo '#!/bin/sh\nbun run /path/to/src/git/hooks/pre-commit.ts' > novel/.git/hooks/pre-commit
 *   chmod +x novel/.git/hooks/pre-commit
 *
 * Environment:
 *   NOVEL_DIR — path to the novel directory (default: cwd)
 *
 * Checks performed:
 *   1. Recall schema validation — staged recall/*.json must parse as RecallMemory
 *   2. Recall actor-ID consistency — actorId field must match directory name
 *   3. Character state schema validation — staged state/characters/*.json
 *   4. Organization state schema validation — staged state/organizations/*.json
 */

import { RecallMemorySchema } from "../../core/types/recall.js";
import { CharacterStateSchema } from "../../core/types/character-state.js";
import { OrganizationStateSchema } from "../../core/types/organization-state.js";

export interface HookViolation {
  file: string;
  check: string;
  detail: string;
}

export interface HookResult {
  violations: HookViolation[];
  checkedFiles: number;
}

export async function getStagedFiles(repoDir: string): Promise<string[]> {
  const proc = Bun.spawnSync(
    ["git", "-C", repoDir, "diff", "--cached", "--name-only"],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (proc.exitCode !== 0) {
    return [];
  }
  return new TextDecoder()
    .decode(proc.stdout)
    .split("\n")
    .filter(Boolean);
}

export async function checkRecallFile(
  relPath: string,
  absPath: string,
): Promise<HookViolation[]> {
  const parts = relPath.split("/");
  if (parts.length < 3 || parts[0] !== "recall") return [];

  const expectedActorId = parts[1]!;
  const violations: HookViolation[] = [];

  let raw: unknown;
  try {
    raw = await Bun.file(absPath).json();
  } catch (e) {
    violations.push({
      file: relPath,
      check: "parse-error",
      detail: `Cannot parse JSON: ${e instanceof Error ? e.message : String(e)}`,
    });
    return violations;
  }

  const result = RecallMemorySchema.safeParse(raw);
  if (!result.success) {
    violations.push({
      file: relPath,
      check: "schema-violation",
      detail: result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
    return violations;
  }

  if (result.data.actorId !== expectedActorId) {
    violations.push({
      file: relPath,
      check: "actor-id-mismatch",
      detail: `Path implies actorId="${expectedActorId}" but file contains actorId="${result.data.actorId}"`,
    });
  }

  return violations;
}

export async function checkCharacterStateFile(
  relPath: string,
  absPath: string,
): Promise<HookViolation[]> {
  let raw: unknown;
  try {
    raw = await Bun.file(absPath).json();
  } catch (e) {
    return [{
      file: relPath,
      check: "parse-error",
      detail: `Cannot parse JSON: ${e instanceof Error ? e.message : String(e)}`,
    }];
  }

  const result = CharacterStateSchema.safeParse(raw);
  if (!result.success) {
    return [{
      file: relPath,
      check: "schema-violation",
      detail: result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    }];
  }

  return [];
}

export async function checkOrganizationStateFile(
  relPath: string,
  absPath: string,
): Promise<HookViolation[]> {
  let raw: unknown;
  try {
    raw = await Bun.file(absPath).json();
  } catch (e) {
    return [{
      file: relPath,
      check: "parse-error",
      detail: `Cannot parse JSON: ${e instanceof Error ? e.message : String(e)}`,
    }];
  }

  const result = OrganizationStateSchema.safeParse(raw);
  if (!result.success) {
    return [{
      file: relPath,
      check: "schema-violation",
      detail: result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    }];
  }

  return [];
}

export async function runChecks(novelDir: string): Promise<HookResult> {
  const staged = await getStagedFiles(novelDir);
  const violations: HookViolation[] = [];
  let checkedFiles = 0;

  for (const relPath of staged) {
    const absPath = `${novelDir}/${relPath}`;

    if (relPath.startsWith("recall/") && relPath.endsWith(".json")) {
      violations.push(...await checkRecallFile(relPath, absPath));
      checkedFiles++;
      continue;
    }

    if (relPath.startsWith("state/characters/") && relPath.endsWith(".json")) {
      violations.push(...await checkCharacterStateFile(relPath, absPath));
      checkedFiles++;
      continue;
    }

    if (relPath.startsWith("state/organizations/") && relPath.endsWith(".json")) {
      violations.push(...await checkOrganizationStateFile(relPath, absPath));
      checkedFiles++;
      continue;
    }
  }

  return { violations, checkedFiles };
}

async function main(): Promise<void> {
  const novelDir = process.env["NOVEL_DIR"] ?? process.cwd();
  const result = await runChecks(novelDir);

  if (result.violations.length === 0) {
    if (result.checkedFiles > 0) {
      console.log(`✓ Pre-commit checks passed (${result.checkedFiles} files checked)`);
    }
    process.exit(0);
  }

  const count = result.violations.length;
  console.error(`\n❌ Pre-commit visibility checks failed (${count} violation${count !== 1 ? "s" : ""}):\n`);
  for (const v of result.violations) {
    console.error(`  [${v.check}] ${v.file}`);
    console.error(`    → ${v.detail}`);
  }
  console.error("\nFix the violations above, then re-commit.\n");
  process.exit(1);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Pre-commit hook crashed:", err);
    process.exit(1);
  });
}
