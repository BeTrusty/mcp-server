import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PricingApiClient, PricingApiError } from "@/clients/pricing-api";
import { registerGetPricingTool } from "./get-pricing";

const mockPricingResponse = {
  nights: 2,
  totalPrice: 300.0,
  currency: "USD",
  appliedDiscounts: [],
  details: [{ concept: "Nightly rate", value: 150.0 }],
  installments: [],
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

describe("get_pricing tool", () => {
  let server: McpServer;
  let originalGetPricing: typeof PricingApiClient.prototype.getPricing;

  beforeEach(() => {
    server = new McpServer({ name: "test-server", version: "0.0.1" });
    originalGetPricing = PricingApiClient.prototype.getPricing;
  });

  // Always restore the prototype, even if the test throws
  afterEach(() => {
    PricingApiClient.prototype.getPricing = originalGetPricing;
  });

  it("registers the get_pricing tool on the server", () => {
    expect(() => registerGetPricingTool(server)).not.toThrow();
  });

  it("returns formatted pricing JSON on valid input", async () => {
    PricingApiClient.prototype.getPricing = mock(async () => mockPricingResponse);

    registerGetPricingTool(server);
    const handler = getToolHandler(server, "get_pricing");

    const result = await handler({
      propertyId: "prop-1",
      roomId: "null",
      checkIn: "2026-04-01",
      checkOut: "2026-04-03",
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text as string);
    expect(parsed.nights).toBe(2);
    expect(parsed.totalPrice).toBe(300.0);
  });

  it("returns isError: true when API throws PricingApiError", async () => {
    PricingApiClient.prototype.getPricing = mock(async () => {
      throw new PricingApiError(404, "Property not found");
    });

    const freshServer = new McpServer({
      name: "test-server-2",
      version: "0.0.1",
    });
    registerGetPricingTool(freshServer);
    const handler = getToolHandler(freshServer, "get_pricing");

    const result = await handler({
      propertyId: "nonexistent",
      roomId: "null",
      checkIn: "2026-04-01",
      checkOut: "2026-04-03",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("returns isError: true when checkIn is same day as checkOut", async () => {
    registerGetPricingTool(server);
    const handler = getToolHandler(server, "get_pricing");

    const result = await handler({
      propertyId: "prop-1",
      roomId: "null",
      checkIn: "2026-04-03",
      checkOut: "2026-04-03",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("checkIn must be before checkOut");
  });

  it("returns isError: true when checkIn is after checkOut", async () => {
    registerGetPricingTool(server);
    const handler = getToolHandler(server, "get_pricing");

    const result = await handler({
      propertyId: "prop-1",
      roomId: "null",
      checkIn: "2026-04-05",
      checkOut: "2026-04-03",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("checkIn must be before checkOut");
  });

  it("returns isError: true on generic network error", async () => {
    PricingApiClient.prototype.getPricing = mock(async () => {
      throw new Error("Network failure");
    });

    const freshServer = new McpServer({
      name: "test-server-3",
      version: "0.0.1",
    });
    registerGetPricingTool(freshServer);
    const handler = getToolHandler(freshServer, "get_pricing");

    const result = await handler({
      propertyId: "prop-1",
      roomId: "null",
      checkIn: "2026-04-01",
      checkOut: "2026-04-03",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network failure");
  });
});
