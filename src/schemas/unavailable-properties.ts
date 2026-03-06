import { z } from "zod";

export const UnavailablePropertiesResponseSchema = z.object({
  data: z.array(z.string()),
});

export type UnavailablePropertiesResponse = z.infer<typeof UnavailablePropertiesResponseSchema>;
