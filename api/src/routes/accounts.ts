import { Router } from "express";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../controllers/accounts";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Apply auth middleware to all account endpoints
router.use(authenticate);

router.get("/", getAccounts);
router.post("/", createAccount);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router;
