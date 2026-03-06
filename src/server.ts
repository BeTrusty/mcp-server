import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "@/tools/index";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "betrusty-mcp",
    version: "0.0.1",
  });

  registerTools(server);

  return server;
}
