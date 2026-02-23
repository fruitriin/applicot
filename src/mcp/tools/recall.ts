import type { RecallEntry, RecallLayer } from "../../core/types/recall.js";
import { RecallLayerEnum } from "../../core/types/recall.js";
import type { SessionContext } from "../context.js";
import { requireActor } from "../context.js";
import type { RecallStore } from "../recall/store.js";
import { searchEntries } from "../recall/search.js";

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

// ── Tool Definitions ──

export const REMEMBER_TOOL = {
  name: "remember",
  description:
    "Store a memory for the current actor. Memories are added to the 'recent' layer.",
  inputSchema: {
    type: "object" as const,
    properties: {
      content: { type: "string", description: "What to remember (natural language description)." },
      sceneId: { type: "string", description: "Scene where this memory was formed (e.g., 'cycle_1-scene_3')." },
      emotion: { type: "string", description: "Primary emotion tag (e.g., 'joy', 'fear', 'surprise')." },
      importance: { type: "number", description: "Importance score 0-100 (default: 50)." },
      keywords: {
        type: "array",
        items: { type: "string" },
        description: "Search keywords for this memory.",
      },
    },
    required: ["content", "sceneId"],
  },
};

export const RECALL_RECENT_TOOL = {
  name: "recall_recent",
  description: "Get the most recent memories for the current actor.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: { type: "number", description: "Max number of memories to return (default: 10)." },
    },
  },
};

export const SEARCH_MEMORIES_TOOL = {
  name: "search_memories",
  description: "Search across all memory layers for the current actor.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Text search (matches content and keywords)." },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Filter by emotion tags (AND match).",
      },
      emotion: { type: "string", description: "Filter by a specific emotion tag." },
      minImportance: { type: "number", description: "Minimum importance score filter." },
    },
  },
};

export const PIN_MEMORY_TOOL = {
  name: "pin_memory",
  description: "Pin a memory to prevent degradation. Moves it to the 'pinned' layer.",
  inputSchema: {
    type: "object" as const,
    properties: {
      memoryId: { type: "string", description: "The ID of the memory to pin." },
    },
    required: ["memoryId"],
  },
};

export const LIST_MEMORIES_TOOL = {
  name: "list_memories",
  description: "List memories for the current actor, optionally filtered by layer.",
  inputSchema: {
    type: "object" as const,
    properties: {
      layer: {
        type: "string",
        enum: ["recent", "midterm", "longterm", "pinned"],
        description: "Memory layer to list. Omit to list all layers.",
      },
    },
  },
};

// ── Handlers ──

export function handleRemember(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  return _handleRemember(ctx, recallStore, args);
}

async function _handleRemember(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const content = args.content as string;
  const sceneId = args.sceneId as string;
  const emotion = args.emotion as string | undefined;
  const importance = (args.importance as number) ?? 50;
  const keywords = (args.keywords as string[]) ?? [];

  const entry: RecallEntry = {
    id: `${actorId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    layer: "recent",
    sceneId,
    content,
    emotionTags: emotion ? [emotion] : [],
    keywords,
    importance: Math.max(0, Math.min(100, importance)),
    createdAt: new Date().toISOString(),
    emotionalIntensity: emotion ? 60 : 30,
  };

  await recallStore.addEntry(actorId, entry);

  return {
    content: [{ type: "text", text: `Memory stored: "${entry.id}"` }],
  };
}

export function handleRecallRecent(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  return _handleRecallRecent(ctx, recallStore, args);
}

async function _handleRecallRecent(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const limit = (args.limit as number) ?? 10;
  const entries = await recallStore.getEntries(actorId, "recent");

  // Sort by creation time descending
  entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limited = entries.slice(0, limit);

  return {
    content: [{ type: "text", text: JSON.stringify(limited, null, 2) }],
  };
}

export function handleSearchMemories(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  return _handleSearchMemories(ctx, recallStore, args);
}

async function _handleSearchMemories(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const allEntries = await recallStore.getAllEntries(actorId);
  const results = searchEntries(allEntries, {
    query: args.query as string | undefined,
    tags: args.tags as string[] | undefined,
    emotion: args.emotion as string | undefined,
    minImportance: args.minImportance as number | undefined,
  });

  return {
    content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
  };
}

export function handlePinMemory(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  return _handlePinMemory(ctx, recallStore, args);
}

async function _handlePinMemory(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const memoryId = args.memoryId as string;
  const found = await recallStore.findEntry(actorId, memoryId);

  if (!found) {
    return {
      content: [{ type: "text", text: `Memory not found: "${memoryId}"` }],
      isError: true,
    };
  }

  if (found.layer === "pinned") {
    return { content: [{ type: "text", text: `Memory "${memoryId}" is already pinned.` }] };
  }

  await recallStore.moveEntry(actorId, memoryId, found.layer, "pinned");
  return { content: [{ type: "text", text: `Memory "${memoryId}" pinned successfully.` }] };
}

export function handleListMemories(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  return _handleListMemories(ctx, recallStore, args);
}

async function _handleListMemories(
  ctx: SessionContext,
  recallStore: RecallStore,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const layer = args.layer as RecallLayer | undefined;

  if (layer) {
    RecallLayerEnum.parse(layer);
    const entries = await recallStore.getEntries(actorId, layer);
    return {
      content: [
        {
          type: "text",
          text: `${layer}: ${entries.length} entries\n${JSON.stringify(entries, null, 2)}`,
        },
      ],
    };
  }

  // All layers summary
  const summary: string[] = [];
  for (const l of RecallLayerEnum.options) {
    const entries = await recallStore.getEntries(actorId, l);
    summary.push(`${l}: ${entries.length} entries`);
  }
  return { content: [{ type: "text", text: summary.join("\n") }] };
}
