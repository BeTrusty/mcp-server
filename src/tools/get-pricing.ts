import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PricingApiClient, PricingApiError } from "@/clients/pricing-api";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function registerGetPricingTool(server: McpServer): void {
  server.tool(
    "get_pricing",
    "Calculate pricing for a property stay. Returns nightly breakdown, total price, currency, fees, discounts, and installment schedule.",
    {
      propertyId: z.string().describe("BeTrusty property ID"),
      roomId: z.string().default("null").describe('Room ID, or "null" for whole-property bookings'),
      checkIn: z.string().regex(DATE_REGEX).describe("Check-in date (YYYY-MM-DD)"),
      checkOut: z.string().regex(DATE_REGEX).describe("Check-out date (YYYY-MM-DD)"),
    },
    async (input) => {
      // Validate that checkIn is strictly before checkOut
      if (new Date(input.checkIn) >= new Date(input.checkOut)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "checkIn must be before checkOut",
            },
          ],
        };
      }

      const client = new PricingApiClient();

      try {
        const pricing = await client.getPricing({
          propertyId: input.propertyId,
          roomId: input.roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pricing, null, 2),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof PricingApiError
            ? `Pricing API error (${error.status}): ${error.message}`
            : error instanceof Error
              ? error.message
              : "Unknown error fetching pricing";

        return {
          isError: true,
          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }
    }
  );
}
