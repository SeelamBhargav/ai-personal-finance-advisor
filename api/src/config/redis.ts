import Redis from "ioredis";
import env from "./env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  enableReadyCheck: false,
  lazyConnect: true, // Don't block startup if Redis is offline
});

let hasLoggedError = false;

redis.on("error", (err) => {
  if (!hasLoggedError) {
    console.warn("⚠️ Redis connection error: Make sure Redis is running. Details:", err.message);
    console.warn("ℹ️ Running in fallback mode. Caching and advanced background jobs are simulated locally.");
    hasLoggedError = true;
  }
});

redis.on("connect", () => {
  console.log("🔌 Redis connection established");
  hasLoggedError = false;
});

// Explicitly connect in the background
redis.connect().catch((err) => {
  if (!hasLoggedError) {
    console.warn("⚠️ Redis lazy connection failed:", err.message);
    hasLoggedError = true;
  }
});

export default redis;

