import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetPricingTool } from "./get-pricing";

export function registerTools(server: McpServer): void {
  registerGetPricingTool(server);
  // Future tools registered here
}
