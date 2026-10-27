"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const rateLimiter_1 = __importDefault(require("../middlewares/rateLimiter"));
const auth_2 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Apply auth rate limiter: max 15 requests per 15 minutes window
const authLimiter = (0, rateLimiter_1.default)({ windowMs: 15 * 60 * 1000, max: 15 });
router.post("/register", authLimiter, auth_1.register);
router.post("/login", authLimiter, auth_1.login);
router.post("/logout", auth_1.logout);
router.post("/refresh", auth_1.refresh);
router.get("/verify-email", auth_1.verifyEmail);
router.post("/password-reset-request", authLimiter, auth_1.passwordResetRequest);
router.post("/password-reset", authLimiter, auth_1.passwordReset);
router.get("/me", auth_2.authenticate, auth_1.getMe);
exports.default = router;
