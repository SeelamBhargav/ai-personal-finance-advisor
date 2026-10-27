"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load environment variables from root directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../../../.env") });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    REDIS_URL: zod_1.z.string().default("redis://localhost:6379"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, "JWT_REFRESH_SECRET is required"),
    OPENAI_API_KEY: zod_1.z.string().default("mock-openai-key"),
    BANKING_API_KEY: zod_1.z.string().default("mock-banking-key"),
    EXCHANGE_RATE_API_KEY: zod_1.z.string().default("mock-exchange-rate-key"),
    EMAIL_API_KEY: zod_1.z.string().default("mock-email-key"),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
exports.default = exports.env;
