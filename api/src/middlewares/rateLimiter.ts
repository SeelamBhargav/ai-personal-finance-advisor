import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// In-memory fallback map if Redis is not connected
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown-ip";
    const key = `ratelimit:${req.path}:${ip}`;

    // Redis Rate Limiting
    try {
      if (redis.status === "ready") {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.pexpire(key, config.windowMs);
        }

        if (current > config.max) {
          res.status(429).json({
            success: false,
            message: "Too many requests from this IP, please try again later.",
          });
          return;
        }
        next();
        return;
      }
    } catch (err) {
      console.warn("⚠️ Rate limiter Redis error, falling back to in-memory store:", err);
    }

    // In-memory Fallback Rate Limiting
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      next();
      return;
    }

    record.count++;
    if (record.count > config.max) {
      res.status(429).json({
        success: false,
        message: "Too many requests from this IP, please try again later.",
      });
      return;
    }

    next();
  };
};
export default rateLimiter;
