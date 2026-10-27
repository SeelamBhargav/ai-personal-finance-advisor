"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const redis_1 = __importDefault(require("../config/redis"));
// In-memory fallback map if Redis is not connected
const memoryStore = new Map();
const rateLimiter = (config) => {
    return async (req, res, next) => {
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown-ip";
        const key = `ratelimit:${req.path}:${ip}`;
        // Redis Rate Limiting
        try {
            if (redis_1.default.status === "ready") {
                const current = await redis_1.default.incr(key);
                if (current === 1) {
                    await redis_1.default.pexpire(key, config.windowMs);
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
        }
        catch (err) {
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
exports.rateLimiter = rateLimiter;
exports.default = exports.rateLimiter;
