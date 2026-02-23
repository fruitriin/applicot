import type { ActorId } from "../../core/types/index.js";
import type { RecallLayer, RecallEntry } from "../../core/types/recall.js";
import { RecallLayerEnum } from "../../core/types/recall.js";
import { readJson, writeJson } from "../../core/store/json-store.js";

export interface RecallStore {
  getEntries(actorId: ActorId, layer: RecallLayer): Promise<RecallEntry[]>;
  getAllEntries(actorId: ActorId): Promise<RecallEntry[]>;
  addEntry(actorId: ActorId, entry: RecallEntry): Promise<void>;
  findEntry(actorId: ActorId, entryId: string): Promise<{ entry: RecallEntry; layer: RecallLayer } | null>;
  moveEntry(actorId: ActorId, entryId: string, fromLayer: RecallLayer, toLayer: RecallLayer): Promise<void>;
  removeEntry(actorId: ActorId, entryId: string, layer: RecallLayer): Promise<void>;
}

export function createRecallStore(novelRoot: string): RecallStore {
  function recallPath(actorId: string, layer: string): string {
    return `recall/${actorId}/${layer}.json`;
  }

  async function readLayer(actorId: string, layer: string): Promise<RecallEntry[]> {
    const data = await readJson<RecallEntry[]>(novelRoot, recallPath(actorId, layer));
    return data ?? [];
  }

  async function writeLayer(actorId: string, layer: string, entries: RecallEntry[]): Promise<void> {
    await writeJson(novelRoot, recallPath(actorId, layer), entries);
  }

  return {
    async getEntries(actorId, layer) {
      return readLayer(actorId, layer);
    },

    async getAllEntries(actorId) {
      const all: RecallEntry[] = [];
      for (const layer of RecallLayerEnum.options) {
        const entries = await readLayer(actorId, layer);
        all.push(...entries);
      }
      return all;
    },

    async addEntry(actorId, entry) {
      const entries = await readLayer(actorId, entry.layer);
      entries.push(entry);
      await writeLayer(actorId, entry.layer, entries);
    },

    async findEntry(actorId, entryId) {
      for (const layer of RecallLayerEnum.options) {
        const entries = await readLayer(actorId, layer);
        const entry = entries.find((e) => e.id === entryId);
        if (entry) return { entry, layer };
      }
      return null;
    },

    async moveEntry(actorId, entryId, fromLayer, toLayer) {
      const fromEntries = await readLayer(actorId, fromLayer);
      const idx = fromEntries.findIndex((e) => e.id === entryId);
      if (idx === -1) return;

      const [entry] = fromEntries.splice(idx, 1);
      entry.layer = toLayer;

      const toEntries = await readLayer(actorId, toLayer);
      toEntries.push(entry);

      await writeLayer(actorId, fromLayer, fromEntries);
      await writeLayer(actorId, toLayer, toEntries);
    },

    async removeEntry(actorId, entryId, layer) {
      const entries = await readLayer(actorId, layer);
      const filtered = entries.filter((e) => e.id !== entryId);
      if (filtered.length !== entries.length) {
        await writeLayer(actorId, layer, filtered);
      }
    },
  };
}
