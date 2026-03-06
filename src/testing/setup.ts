/**
 * Test environment setup — preloaded by bunfig.toml before all tests.
 * Sets required env vars so config.ts validation passes.
 */
process.env.PRICING_API_BASE_URL = "https://api.betrusty-test.com";
process.env.NODE_ENV = "development";
