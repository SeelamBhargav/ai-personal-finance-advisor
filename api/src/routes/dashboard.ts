import { Router } from "express";
import {
  getDashboardData,
  createTransaction,
  createBudget,
  createGoal,
  resolveAnomaly,
  chatCopilot,
  getHealthScore,
  getAIInsights,
  scanReceipt,
  bulkCategorize,
  bulkDelete,
  getAuditLogs,
} from "../controllers/dashboard";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all dashboard endpoints
router.use(authenticate);

router.get("/data", getDashboardData);
router.post("/transaction", createTransaction);
router.post("/budget", createBudget);
router.post("/goal", createGoal);
router.post("/resolve-anomaly", resolveAnomaly);
router.post("/chat", chatCopilot);
router.get("/health-score", getHealthScore);
router.get("/insights", getAIInsights);
router.post("/scan-receipt", scanReceipt);
router.post("/transactions/bulk-categorize", bulkCategorize);
router.post("/transactions/bulk-delete", bulkDelete);
router.get("/audit-logs", getAuditLogs);

export default router;
