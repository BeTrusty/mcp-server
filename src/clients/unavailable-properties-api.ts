import { getConfig } from "@/config";
import {
  type UnavailablePropertiesResponse,
  UnavailablePropertiesResponseSchema,
} from "@/schemas/unavailable-properties";

export interface UnavailablePropertiesRequestParams {
  checkIn: string;
  checkOut: string;
}

export class UnavailablePropertiesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "UnavailablePropertiesApiError";
  }
}

export class UnavailablePropertiesApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    // getConfig() is only called when no baseUrl is provided (i.e. not in tests)
    this.baseUrl = baseUrl ?? getConfig().PRICING_API_BASE_URL;
  }

  async getUnavailableProperties(
    params: UnavailablePropertiesRequestParams
  ): Promise<UnavailablePropertiesResponse> {
    const { checkIn, checkOut } = params;

    const url = new URL(`${this.baseUrl}/api/properties/unavailable`);
    url.searchParams.set("checkIn", checkIn);
    url.searchParams.set("checkOut", checkOut);

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new UnavailablePropertiesApiError(
        response.status,
        `Unavailable properties API error ${response.status}: ${text}`
      );
    }

    const raw = await response.json();
    return UnavailablePropertiesResponseSchema.parse(raw);
  }
}
