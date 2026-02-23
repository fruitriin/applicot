import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ActorId, DataId } from "../types/index.js";
import { resolveDataPath, isJsonPath } from "./paths.js";
import { readJson, writeJson } from "./json-store.js";
import { readMarkdown, writeMarkdown } from "./markdown-store.js";

export interface StoreConfig {
  novelRoot: string;
}

export interface StoreAccess {
  /** Read data. Returns null if not found. */
  read<T = unknown>(dataId: DataId): Promise<T | null>;
  /** Write data. Creates parent directories as needed. */
  write(dataId: DataId, data: unknown): Promise<void>;
  /** List entity IDs within a data category. */
  list(prefix: string): Promise<string[]>;
  /** Check if data exists. */
  exists(dataId: DataId): Promise<boolean>;
}

/**
 * Raw store without visibility checks.
 * Visibility filtering is applied at a higher level (StoreWithVisibility).
 */
export function createStore(config: StoreConfig): StoreAccess {
  const { novelRoot } = config;

  return {
    async read<T = unknown>(dataId: DataId): Promise<T | null> {
      const path = resolveDataPath(dataId);
      if (isJsonPath(path)) {
        return readJson<T>(novelRoot, path);
      }
      const content = await readMarkdown(novelRoot, path);
      return content as T | null;
    },

    async write(dataId: DataId, data: unknown): Promise<void> {
      const path = resolveDataPath(dataId);
      if (isJsonPath(path)) {
        await writeJson(novelRoot, path, data);
      } else {
        await writeMarkdown(novelRoot, path, data as string);
      }
    },

    async list(prefix: string): Promise<string[]> {
      const path = resolveDataPath(prefix);
      const fullPath = join(novelRoot, path);
      try {
        const entries = await readdir(fullPath);
        return entries
          .filter((e) => !e.startsWith("."))
          .map((e) => e.replace(/\.(json|md)$/, ""));
      } catch {
        return [];
      }
    },

    async exists(dataId: DataId): Promise<boolean> {
      const path = resolveDataPath(dataId);
      const file = Bun.file(join(novelRoot, path));
      return file.exists();
    },
  };
}
