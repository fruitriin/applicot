import type { SessionContext } from "../context.js";
import { requireActor, canWrite } from "../context.js";
import { AccessDeniedError, WriteDeniedError } from "../errors.js";
import { isJsonPath, resolveDataPath } from "../../core/store/paths.js";

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

// ── Tool Definitions ──

export const READ_DATA_TOOL = {
  name: "read_data",
  description:
    "Read data from the novel store. Visibility rules are enforced — " +
    "you can only read data your actor is allowed to see.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dataId: {
        type: "string",
        description:
          'Data identifier. Examples: "HO-PUB", "HO-PRV-alice", "ST-CHR-alice", "ST-ENV", "TRK-FSH"',
      },
    },
    required: ["dataId"],
  },
};

export const WRITE_DATA_TOOL = {
  name: "write_data",
  description:
    "Write data to the novel store. Write permissions are enforced. " +
    "For JSON data, pass a valid JSON string. For Markdown, pass the raw text.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dataId: {
        type: "string",
        description: "Data identifier to write to.",
      },
      content: {
        type: "string",
        description: "Content to write. JSON string for .json files, raw text for .md files.",
      },
    },
    required: ["dataId", "content"],
  },
};

export const LIST_DATA_TOOL = {
  name: "list_data",
  description:
    "List available data IDs under a given prefix, filtered by your actor's visibility. " +
    'Example prefixes: "ST-CHR", "HO-PUB", "ST-ORG"',
  inputSchema: {
    type: "object" as const,
    properties: {
      prefix: {
        type: "string",
        description: 'Data type prefix. Examples: "ST-CHR", "HO-PUB", "ST-ORG", "RCL"',
      },
    },
    required: ["prefix"],
  },
};

// ── Handlers ──

export function handleReadData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  return _handleReadData(ctx, args);
}

async function _handleReadData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  const dataId = args.dataId as string;

  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  // Check visibility
  const access = ctx.visibilityEngine.canAccess({ actorId, dataId });
  if (!access.allowed) {
    return {
      content: [{ type: "text", text: new AccessDeniedError(actorId, dataId, access.reason).message }],
      isError: true,
    };
  }

  const data = await ctx.store.read(dataId);
  if (data === null) {
    return { content: [{ type: "text", text: `No data found for "${dataId}".` }] };
  }

  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

export function handleWriteData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  return _handleWriteData(ctx, args);
}

async function _handleWriteData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  const dataId = args.dataId as string;
  const content = args.content as string;

  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  // Check write permission
  if (!canWrite(actorId, dataId)) {
    return {
      content: [{ type: "text", text: new WriteDeniedError(actorId, dataId).message }],
      isError: true,
    };
  }

  try {
    const path = resolveDataPath(dataId);
    if (isJsonPath(path)) {
      // Validate JSON before writing
      const parsed = JSON.parse(content);
      await ctx.store.write(dataId, parsed);
    } else {
      await ctx.store.write(dataId, content);
    }
    return { content: [{ type: "text", text: `Successfully wrote to "${dataId}".` }] };
  } catch (e) {
    return {
      content: [{ type: "text", text: `Write failed: ${(e as Error).message}` }],
      isError: true,
    };
  }
}

export function handleListData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  return _handleListData(ctx, args);
}

async function _handleListData(ctx: SessionContext, args: Record<string, unknown>): Promise<ToolResult> {
  const prefix = args.prefix as string;

  let actorId: string;
  try {
    actorId = requireActor(ctx);
  } catch (e) {
    return { content: [{ type: "text", text: (e as Error).message }], isError: true };
  }

  const names = await ctx.store.list(prefix);
  const dataIds = names.map((name) => `${prefix}-${name}`);

  // Filter by visibility
  const visible = dataIds.filter((dataId) => {
    const access = ctx.visibilityEngine.canAccess({ actorId, dataId });
    return access.allowed;
  });

  if (visible.length === 0) {
    return { content: [{ type: "text", text: `No visible data found under "${prefix}".` }] };
  }

  return { content: [{ type: "text", text: JSON.stringify(visible, null, 2) }] };
}
