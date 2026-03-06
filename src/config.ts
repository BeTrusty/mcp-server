import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number().default(3002),
  PRICING_API_BASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export type McpConfig = z.infer<typeof configSchema>;

/**
 * Lazily parse and return the validated config from process.env.
 * Using a function prevents module-load-time failures in test environments
 * where not all env vars are set.
 */
export function getConfig(): McpConfig {
  return configSchema.parse(process.env);
}
