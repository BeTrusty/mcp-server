import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  UnavailablePropertiesApiClient,
  UnavailablePropertiesApiError,
} from "./unavailable-properties-api";

const MOCK_BASE_URL = "https://api.betrusty-test.com";

const mockUnavailableResponse = {
  data: ["abc123", "def456", "ghi789"],
};

const mockEmptyResponse = {
  data: [],
};

describe("UnavailablePropertiesApiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  // Always restore fetch, even if the test throws
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("constructs correct URL with checkIn and checkOut query params", async () => {
    let capturedUrl = "";

    globalThis.fetch = mock(async (input: string | URL | Request) => {
      capturedUrl = input.toString();
      return new Response(JSON.stringify(mockUnavailableResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);
    await client.getUnavailableProperties({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(capturedUrl).toBe(
      `${MOCK_BASE_URL}/api/properties/unavailable?checkIn=2026-04-01&checkOut=2026-04-10`
    );
  });

  it("returns parsed unavailable property IDs on success", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify(mockUnavailableResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);
    const result = await client.getUnavailableProperties({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.data).toHaveLength(3);
    expect(result.data).toContain("abc123");
    expect(result.data).toContain("def456");
    expect(result.data).toContain("ghi789");
  });

  it("returns empty array when no properties are unavailable", async () => {
    globalThis.fetch = mock(async () => {
      return new Response(JSON.stringify(mockEmptyResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);
    const result = await client.getUnavailableProperties({
      checkIn: "2026-04-01",
      checkOut: "2026-04-10",
    });

    expect(result.data).toHaveLength(0);
  });

  it("throws UnavailablePropertiesApiError on non-OK response", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);

    await expect(
      client.getUnavailableProperties({
        checkIn: "2026-04-01",
        checkOut: "2026-04-10",
      })
    ).rejects.toBeInstanceOf(UnavailablePropertiesApiError);
  });

  it("throws UnavailablePropertiesApiError with correct status code", async () => {
    globalThis.fetch = mock(async () => {
      return new Response("Bad Request", { status: 400 });
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);

    let caughtError: UnavailablePropertiesApiError | undefined;
    try {
      await client.getUnavailableProperties({
        checkIn: "2026-04-01",
        checkOut: "2026-04-10",
      });
    } catch (e) {
      if (e instanceof UnavailablePropertiesApiError) {
        caughtError = e;
      }
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(400);
  });

  it("propagates AbortError on timeout", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");

    globalThis.fetch = mock(async () => {
      throw abortError;
    }) as unknown as typeof fetch;

    const client = new UnavailablePropertiesApiClient(MOCK_BASE_URL);

    await expect(
      client.getUnavailableProperties({
        checkIn: "2026-04-01",
        checkOut: "2026-04-10",
      })
    ).rejects.toBeInstanceOf(DOMException);
  });
});
