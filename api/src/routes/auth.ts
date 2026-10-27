import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh,
  verifyEmail,
  passwordResetRequest,
  passwordReset,
  getMe,
} from "../controllers/auth";
import rateLimiter from "../middlewares/rateLimiter";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth rate limiter: max 15 requests per 15 minutes window
const authLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 15 });

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/verify-email", verifyEmail);
router.post("/password-reset-request", authLimiter, passwordResetRequest);
router.post("/password-reset", authLimiter, passwordReset);
router.get("/me", authenticate, getMe);

export default router;
