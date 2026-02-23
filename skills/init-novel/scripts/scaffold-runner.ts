#!/usr/bin/env bun
/**
 * Novel project scaffold runner.
 * Usage: bun run skills/init-novel/scripts/scaffold-runner.ts <config.json>
 * Must be run from the applicot project root.
 */
import { resolve } from "node:path";

const configPath = process.argv[2];
if (!configPath) {
  console.error("Usage: bun run <script> <config.json>");
  process.exit(1);
}

const applicotRoot = process.cwd();
const { scaffoldNovelDirectory } = await import(
  resolve(applicotRoot, "src/cli/scaffold.ts")
);

const config = JSON.parse(await Bun.file(resolve(configPath)).text());

await scaffoldNovelDirectory({
  ...config,
  applicotPath: applicotRoot,
});

console.log(`✅ Novel project scaffolded at: ${config.novelRoot}`);
