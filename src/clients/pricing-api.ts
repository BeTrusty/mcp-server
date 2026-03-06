import { getConfig } from "@/config";
import { type PricingResponse, PricingResponseSchema } from "@/schemas/pricing";

export interface PricingRequestParams {
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
}

export class PricingApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PricingApiError";
  }
}

export class PricingApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    // getConfig() is only called when no baseUrl is provided (i.e. not in tests)
    this.baseUrl = baseUrl ?? getConfig().PRICING_API_BASE_URL;
  }

  async getPricing(params: PricingRequestParams): Promise<PricingResponse> {
    const { propertyId, roomId, checkIn, checkOut } = params;

    const url = `${this.baseUrl}/api/pricing-calculation/property/${propertyId}/room/${roomId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn, checkOut }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new PricingApiError(response.status, `Pricing API error ${response.status}: ${text}`);
    }

    const raw = await response.json();
    return PricingResponseSchema.parse(raw);
  }
}
