import { Router } from "express";
import { generateReport } from "../controllers/reports";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all report endpoints
router.use(authenticate);

router.get("/generate", generateReport);

export default router;
