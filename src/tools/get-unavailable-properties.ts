import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  UnavailablePropertiesApiClient,
  UnavailablePropertiesApiError,
} from "@/clients/unavailable-properties-api";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function registerGetUnavailablePropertiesTool(server: McpServer): void {
  server.tool(
    "get_unavailable_properties",
    "Get property IDs that are unavailable (have at least one overlapping calendar event) for a given date range. Useful for filtering out booked or blocked properties before displaying availability.",
    {
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

      const client = new UnavailablePropertiesApiClient();

      try {
        const result = await client.getUnavailableProperties({
          checkIn: input.checkIn,
          checkOut: input.checkOut,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof UnavailablePropertiesApiError
            ? `Unavailable properties API error (${error.status}): ${error.message}`
            : error instanceof Error
              ? error.message
              : "Unknown error fetching unavailable properties";

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
