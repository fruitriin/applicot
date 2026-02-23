import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createSessionContext } from "./context.js";
import { createRecallStore } from "./recall/store.js";
import { SET_ACTOR_TOOL, handleSetActor } from "./tools/actor.js";
import {
  READ_DATA_TOOL,
  WRITE_DATA_TOOL,
  LIST_DATA_TOOL,
  handleReadData,
  handleWriteData,
  handleListData,
} from "./tools/store.js";
import {
  REMEMBER_TOOL,
  RECALL_RECENT_TOOL,
  SEARCH_MEMORIES_TOOL,
  PIN_MEMORY_TOOL,
  LIST_MEMORIES_TOOL,
  handleRemember,
  handleRecallRecent,
  handleSearchMemories,
  handlePinMemory,
  handleListMemories,
} from "./tools/recall.js";

const novelRoot = process.env.APPLICOT_NOVEL_DIR;
if (!novelRoot) {
  console.error("Error: APPLICOT_NOVEL_DIR environment variable is required.");
  process.exit(1);
}

const ctx = createSessionContext(novelRoot);
const recallStore = createRecallStore(novelRoot);

const server = new Server(
  { name: "applicot", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    SET_ACTOR_TOOL,
    READ_DATA_TOOL,
    WRITE_DATA_TOOL,
    LIST_DATA_TOOL,
    REMEMBER_TOOL,
    RECALL_RECENT_TOOL,
    SEARCH_MEMORIES_TOOL,
    PIN_MEMORY_TOOL,
    LIST_MEMORIES_TOOL,
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const toolArgs = (args ?? {}) as Record<string, unknown>;

  switch (name) {
    case "set_actor":
      return handleSetActor(ctx, toolArgs);
    case "read_data":
      return handleReadData(ctx, toolArgs);
    case "write_data":
      return handleWriteData(ctx, toolArgs);
    case "list_data":
      return handleListData(ctx, toolArgs);
    case "remember":
      return handleRemember(ctx, recallStore, toolArgs);
    case "recall_recent":
      return handleRecallRecent(ctx, recallStore, toolArgs);
    case "search_memories":
      return handleSearchMemories(ctx, recallStore, toolArgs);
    case "pin_memory":
      return handlePinMemory(ctx, recallStore, toolArgs);
    case "list_memories":
      return handleListMemories(ctx, recallStore, toolArgs);
    default:
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Applicot MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
