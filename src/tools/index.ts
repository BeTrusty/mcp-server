import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetPricingTool } from "./get-pricing";
import { registerGetUnavailablePropertiesTool } from "./get-unavailable-properties";

export function registerTools(server: McpServer): void {
  registerGetPricingTool(server);
  registerGetUnavailablePropertiesTool(server);
}
