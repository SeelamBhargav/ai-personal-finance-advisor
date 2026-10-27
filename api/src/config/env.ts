import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  OPENAI_API_KEY: z.string().default("mock-openai-key"),
  BANKING_API_KEY: z.string().default("mock-banking-key"),
  EXCHANGE_RATE_API_KEY: z.string().default("mock-exchange-rate-key"),
  EMAIL_API_KEY: z.string().default("mock-email-key"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
