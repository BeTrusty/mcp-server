import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { PricingApiClient, PricingApiError } from "./pricing-api";

const MOCK_BASE_URL = "https://api.betrusty-test.com";

const mockPricingResponse = {
  nights: 3,
  totalPrice: 450.0,
  currency: "USD",
  appliedDiscounts: [],
  details: [
    { concept: "Nightly rate", value: 150.0 },
    { concept: "Cleaning fee", value: 0 },
  ],
  installments: [
    {
      index: 1,
      dueDate: "2026-04-01",
      currency: "USD",
      totalPrice: 450.0,
      totalNights: 3,
      details: [{ concept: "Nightly rate", value: 150.0 }],
      breakdown: [],
    },
  ],
};

describe("PricingApiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  // Always restore fetch, even if the test throws
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("constructs correct URL with propertyId and roomId", async () => {
    let capturedUrl = "";

    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return new Response(JSON.stringify(mockPricingResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const client = new PricingApiClient(MOCK_BASE_URL);
    await client.getPricing({
      propertyId: "prop-123",
      roomId: "room-456",
      checkIn: "2026-04-01",
      checkOut: "2026-04-04",
    });

    expect(capturedUrl).toBe(
      `${MOCK_BASE_URL}/api/pricing-calculation/property/prop-123/room/room-456`
    );
  });

  it("returns parsed pricing response on success", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify(mockPricingResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const client = new PricingApiClient(MOCK_BASE_URL);
    const result = await client.getPricing({
      propertyId: "prop-123",
      roomId: "null",
      checkIn: "2026-04-01",
      checkOut: "2026-04-04",
    });

    expect(result.nights).toBe(3);
    expect(result.totalPrice).toBe(450.0);
    expect(result.currency).toBe("USD");
    expect(result.installments).toHaveLength(1);
  });

  it("throws PricingApiError on non-OK response", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Property not found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    const client = new PricingApiClient(MOCK_BASE_URL);

    await expect(
      client.getPricing({
        propertyId: "nonexistent",
        roomId: "null",
        checkIn: "2026-04-01",
        checkOut: "2026-04-04",
      })
    ).rejects.toBeInstanceOf(PricingApiError);
  });

  it("throws PricingApiError with correct status code", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Unauthorized", { status: 401 });
    }) as typeof fetch;

    const client = new PricingApiClient(MOCK_BASE_URL);

    let caughtError: PricingApiError | undefined;
    try {
      await client.getPricing({
        propertyId: "prop-123",
        roomId: "null",
        checkIn: "2026-04-01",
        checkOut: "2026-04-04",
      });
    } catch (e) {
      if (e instanceof PricingApiError) {
        caughtError = e;
      }
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(401);
  });

  it("propagates AbortError on timeout", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");

    globalThis.fetch = mock(async () => {
      throw abortError;
    }) as typeof fetch;

    const client = new PricingApiClient(MOCK_BASE_URL);

    await expect(
      client.getPricing({
        propertyId: "prop-123",
        roomId: "null",
        checkIn: "2026-04-01",
        checkOut: "2026-04-04",
      })
    ).rejects.toBeInstanceOf(DOMException);
  });
});
