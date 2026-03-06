import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  UnavailablePropertiesApiClient,
  UnavailablePropertiesApiError,
} from "@/clients/unavailable-properties-api";
import { registerGetUnavailablePropertiesTool } from "./get-unavailable-properties";

const mockUnavailableResponse = {
  data: ["prop-1", "prop-2", "prop-3"],
};

// Helper: get the registered tool handler from an McpServer instance.
// In SDK v1.27, _registeredTools is a plain Record<string, {handler, ...}>
function getToolHandler(server: McpServer, toolName: string): any {
  const tools = (server as any)._registeredTools as Record<string, any>;
  const entry = tools[toolName];
  if (!entry) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  return entry.handler;
}

describe("get_unavailable_properties tool", () => {
  let server: McpServer;
  let originalGetUnavailableProperties: typeof UnavailablePropertiesApiClient.prototype.getUnavailableProperties;

  beforeEach(() => {
    server = new McpServer({ name: "test-server", version: "0.0.1" });
    originalGetUnavailableProperties =
      UnavailablePropertiesApiClient.prototype.getUnavailableProperties;
  });

  // Always restore the prototype, even if the test throws
  afterEach(() => {
    UnavailablePropertiesApiClient.prototype.getUnavailableProperties =
      originalGetUnavailableProperties;
  });

  it("registers the get_unavailable_properties tool on the server", () => {
    expect(() => registerGetUnavailablePropertiesTool(server)).not.toThrow();
  });

  it("returns formatted unavailable property IDs on valid input", async () => {
    UnavailablePropertiesApiClient.prototype.getUnavailableProperties = mock(
      async () => mockUnavailableResponse
    );

    registerGetUnavailablePropertiesTool(server);
    const handler = getToolHandler(server, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.data).toHaveLength(3);
    expect(parsed.data).toContain("prop-1");
  });

  it("returns empty data array when no properties are unavailable", async () => {
    UnavailablePropertiesApiClient.prototype.getUnavailableProperties = mock(async () => ({
      data: [],
    }));

    registerGetUnavailablePropertiesTool(server);
    const handler = getToolHandler(server, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.data).toHaveLength(0);
  });

  it("returns isError: true when API throws UnavailablePropertiesApiError", async () => {
    UnavailablePropertiesApiClient.prototype.getUnavailableProperties = mock(async () => {
      throw new UnavailablePropertiesApiError(500, "Internal Server Error");
    });

    const freshServer = new McpServer({ name: "test-server-2", version: "0.0.1" });
    registerGetUnavailablePropertiesTool(freshServer);
    const handler = getToolHandler(freshServer, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("500");
  });

  it("returns isError: true when checkIn is same day as checkOut", async () => {
    registerGetUnavailablePropertiesTool(server);
    const handler = getToolHandler(server, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-05",
      checkOut: "2026-04-05",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("checkIn must be before checkOut");
  });

  it("returns isError: true when checkIn is after checkOut", async () => {
    registerGetUnavailablePropertiesTool(server);
    const handler = getToolHandler(server, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-10",
      checkOut: "2026-04-01",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("checkIn must be before checkOut");
  });

  it("returns isError: true on generic network error", async () => {
    UnavailablePropertiesApiClient.prototype.getUnavailableProperties = mock(async () => {
      throw new Error("Network failure");
    });

    const freshServer = new McpServer({ name: "test-server-3", version: "0.0.1" });
    registerGetUnavailablePropertiesTool(freshServer);
    const handler = getToolHandler(freshServer, "get_unavailable_properties");

    const result = await handler({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network failure");
  });
});
