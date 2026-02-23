export function generateMcpJson(applicotPath: string): object {
  return {
    mcpServers: {
      applicot: {
        type: "stdio",
        command: "bun",
        args: ["run", `${applicotPath}/src/mcp/server.ts`],
        env: {
          APPLICOT_NOVEL_DIR: ".",
        },
      },
    },
  };
}
