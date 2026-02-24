/**
 * applicot scene コマンド
 *
 * Usage:
 *   applicot scene next          -- 次のシーンを生成
 *   applicot scene run           -- 残り全シーンを生成
 *   applicot scene status        -- 現在のサイクル進捗を表示
 */

import { executeScenePipeline } from "../../orchestrator/pipeline.js";
import type { CycleContext, SceneResult } from "../../orchestrator/types.js";
import { createStore } from "../../core/store/store.js";

interface NovelConfig {
  title: string;
  cycleNumber: number;
  totalScenes: number;
  completedScenes: number;
}

const DEFAULT_CONFIG: NovelConfig = {
  title: "untitled",
  cycleNumber: 1,
  totalScenes: 4,
  completedScenes: 0,
};

async function loadConfig(novelDir: string): Promise<NovelConfig> {
  const store = createStore({ novelRoot: novelDir });
  const cfg = await store.read<NovelConfig>("META-CONFIG");
  return { ...DEFAULT_CONFIG, ...(cfg ?? {}) };
}

async function saveConfig(novelDir: string, config: NovelConfig): Promise<void> {
  const store = createStore({ novelRoot: novelDir });
  await store.write("META-CONFIG", config);
}

async function saveManuscript(
  novelDir: string,
  result: SceneResult,
): Promise<void> {
  const store = createStore({ novelRoot: novelDir });
  const dataId =
    "OUT-SCN-" +
    String(result.scenePrompt.cycleNumber) +
    "-" +
    String(result.scenePrompt.sceneNumber);
  await store.write(dataId, result.manuscript.markdownContent);
}

export async function sceneNext(novelDir: string): Promise<void> {
  const config = await loadConfig(novelDir);

  if (config.completedScenes >= config.totalScenes) {
    console.log(
      "サイクル " +
        config.cycleNumber +
        " のすべてのシーンが完了しています（" +
        config.totalScenes +
        "/" +
        config.totalScenes +
        "）",
    );
    return;
  }

  const sceneNumber = config.completedScenes + 1;
  const ctx: CycleContext = {
    novelDir,
    cycleNumber: config.cycleNumber,
    totalScenes: config.totalScenes,
    completedScenes: config.completedScenes,
  };

  console.log(
    "シーン " +
      sceneNumber +
      "/" +
      config.totalScenes +
      " を生成中... （サイクル " +
      config.cycleNumber +
      "）",
  );

  const result = await executeScenePipeline(sceneNumber, ctx);

  await saveManuscript(novelDir, result);
  config.completedScenes = sceneNumber;
  await saveConfig(novelDir, config);

  console.log("");
  console.log(
    "✅ シーン " +
      sceneNumber +
      " 完了（修正 " +
      result.revisionCount +
      " 回）",
  );
  console.log("");
  console.log(result.manuscript.markdownContent);
}

export async function sceneRun(novelDir: string): Promise<void> {
  const config = await loadConfig(novelDir);
  const remaining = config.totalScenes - config.completedScenes;

  if (remaining <= 0) {
    console.log("全シーン完了済み。");
    return;
  }

  console.log(remaining + " シーンを順番に生成します...");

  for (let i = 0; i < remaining; i++) {
    await sceneNext(novelDir);
  }
}

export async function sceneStatus(novelDir: string): Promise<void> {
  const config = await loadConfig(novelDir);
  console.log("=== applicot サイクル状態 ===");
  console.log("タイトル     : " + config.title);
  console.log("サイクル     : " + config.cycleNumber);
  console.log(
    "進捗         : " +
      config.completedScenes +
      "/" +
      config.totalScenes +
      " シーン完了",
  );
  const remaining = config.totalScenes - config.completedScenes;
  if (remaining > 0) {
    console.log("次のシーン   : シーン " + (config.completedScenes + 1));
  } else {
    console.log("状態         : サイクル完了");
  }
}

// CLI エントリポイント
if (import.meta.main) {
  const args = process.argv.slice(2);
  const subcommand = args[0];
  const novelDir =
    process.env.APPLICOT_NOVEL_DIR ??
    args.find((a) => !a.startsWith("-")) ??
    "./novel";

  if (subcommand === "next") {
    await sceneNext(novelDir);
  } else if (subcommand === "run") {
    await sceneRun(novelDir);
  } else if (subcommand === "status") {
    await sceneStatus(novelDir);
  } else {
    console.error(
      "Usage: applicot scene <next|run|status> [novelDir]",
    );
    process.exit(1);
  }
}
