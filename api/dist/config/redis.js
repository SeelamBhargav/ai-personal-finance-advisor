"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("./env"));
exports.redis = new ioredis_1.default(env_1.default.REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ compatibility
    enableReadyCheck: false,
    lazyConnect: true, // Don't block startup if Redis is offline
});
let hasLoggedError = false;
exports.redis.on("error", (err) => {
    if (!hasLoggedError) {
        console.warn("⚠️ Redis connection error: Make sure Redis is running. Details:", err.message);
        console.warn("ℹ️ Running in fallback mode. Caching and advanced background jobs are simulated locally.");
        hasLoggedError = true;
    }
});
exports.redis.on("connect", () => {
    console.log("🔌 Redis connection established");
    hasLoggedError = false;
});
// Explicitly connect in the background
exports.redis.connect().catch((err) => {
    if (!hasLoggedError) {
        console.warn("⚠️ Redis lazy connection failed:", err.message);
        hasLoggedError = true;
    }
});
exports.default = exports.redis;
